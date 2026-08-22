# Cross-App Comparison Agent

## 1. Project Overview

Cross-App Comparison Agent is an AI agent that compares products or services from multiple merchants and recommends the best option based on the user's requirements.

The user can provide a request such as:

> "Find running shoes under ₹3,000. I want the cheapest option."

The agent searches multiple merchants, compares the results, recommends the best option, and can proceed with a Razorpay test-mode payment after user approval.

---

## 2. Main Flow

```text
User
  ↓
AI Agent
  ↓
Understand User Request
  ↓
Search Multiple Merchants
  ↓
Compare Results
  ↓
Recommend Best Option
  ↓
User Approval
  ↓
Validate Budget and Rules
  ↓
Razorpay Test Payment
  ↓
Payment Result
  ↓
Audit Trail
