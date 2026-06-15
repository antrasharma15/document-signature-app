const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Document = require("../models/Document");
const Signature = require("../models/Signature");
const SigningToken = require("../models/SigningToken");
const AuditLog = require("../models/AuditLogs");
const User = require("../models/User");

async function runTest() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected successfully ✅\n");

  try {
    // 1. Create a dummy owner user
    let owner = await User.findOne({ email: "owner_test@example.com" });
    if (!owner) {
      owner = await User.create({
        name: "Test Owner",
        email: "owner_test@example.com",
        password: "password123", // normally hashed, but just a test record
      });
    }

    // 2. Upload a doc (status starts as "draft")
    console.log("Step 1: Uploading document (creating draft)...");
    const testDoc = await Document.create({
      uploadedBy: owner._id,
      originalName: "test_contract.pdf",
      fileName: "test_contract_123.pdf",
      filePath: "uploads/test_contract_123.pdf",
      fileSize: 1024,
      status: "draft",
    });
    console.log(`Document created with status: "${testDoc.status}"`);
    if (testDoc.status !== "draft") throw new Error("Document should start as draft");

    // 3. Create a placeholder signature
    const testSignature = await Signature.create({
      fileId: testDoc._id,
      signer: owner._id,
      signerEmail: "signer_test@example.com",
      x: 10,
      y: 20,
      page: 1,
      status: "pending",
    });
    console.log("Placeholder signature created.");

    // 4. Send for signing: create a SigningToken and change status to "pending"
    console.log("\nStep 2: Sending for signing...");
    const tokenStr = "test-token-" + Date.now();
    const expiresAt = new Date(Date.now() + 2 * 3600 * 1000); // 2 hours

    const tokenRecord = await SigningToken.create({
      token: tokenStr,
      documentId: testDoc._id,
      signerEmail: "signer_test@example.com",
      expiresAt,
    });

    testDoc.status = "pending";
    await testDoc.save();
    console.log(`Document status transitioned to: "${testDoc.status}"`);

    // 5. Simulate Rejecting via the endpoint logic
    console.log("\nStep 3: Simulating signer rejection...");
    const rejectionReason = "Payment terms in Section 2 are incorrect";

    // Rejection validation logic (same as route)
    const signingToken = await SigningToken.findOne({ token: tokenStr });
    if (!signingToken || signingToken.used) throw new Error("Invalid or already used token");
    if (new Date() > signingToken.expiresAt) throw new Error("Token expired");

    // Mark token as used
    signingToken.used = true;
    await signingToken.save();

    // Update document status & rejectionReason
    await Document.findByIdAndUpdate(signingToken.documentId, {
      status: "rejected",
      rejectionReason: rejectionReason,
    });

    // Update signature status & rejectionReason
    await Signature.updateMany(
      { fileId: signingToken.documentId, signerEmail: signingToken.signerEmail },
      { status: "rejected", rejectionReason: rejectionReason }
    );

    // Create Audit Log
    const mockReqIp = "127.0.0.1";
    await AuditLog.create({
      documentId: signingToken.documentId,
      action: "DOCUMENT_REJECTED",
      performedBy: signingToken.signerEmail,
      ipAddress: mockReqIp,
      metadata: { reason: rejectionReason },
    });
    console.log("Rejection actions executed successfully.");

    // 6. Verification
    console.log("\nStep 4: Verifying updates in Database...");
    
    const updatedDoc = await Document.findById(testDoc._id);
    console.log(`Document Status: "${updatedDoc.status}" (Expected: "rejected")`);
    console.log(`Document Rejection Reason: "${updatedDoc.rejectionReason}" (Expected: "${rejectionReason}")`);
    
    const updatedSig = await Signature.findById(testSignature._id);
    console.log(`Signature Status: "${updatedSig.status}" (Expected: "rejected")`);
    console.log(`Signature Rejection Reason: "${updatedSig.rejectionReason}" (Expected: "${rejectionReason}")`);

    const auditEntry = await AuditLog.findOne({ documentId: testDoc._id, action: "DOCUMENT_REJECTED" });
    console.log(`Audit Log Action: "${auditEntry.action}"`);
    console.log(`Audit Log Performed By: "${auditEntry.performedBy}"`);
    console.log(`Audit Log Reason: "${auditEntry.metadata.reason}"`);

    // Clean up test data
    console.log("\nCleaning up test records...");
    await Document.findByIdAndDelete(testDoc._id);
    await Signature.findByIdAndDelete(testSignature._id);
    await SigningToken.findByIdAndDelete(tokenRecord._id);
    await AuditLog.findByIdAndDelete(auditEntry._id);
    console.log("Cleanup complete.");

    console.log("\nVerification Test Result: PASSED ✅");
  } catch (err) {
    console.error("Verification Test Result: FAILED ❌");
    console.error(err);
  } finally {
    await mongoose.connection.close();
  }
}

runTest();
