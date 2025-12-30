# Document Tagging Guide - RAG Chatbot

## Overview
You can now query specific documents using `@` or `#` tags in the chatbot!

## How to Use

### Basic Syntax
```
@document-id your question here
# OR
#document-id your question here
```

### Examples

**Query leave policy:**
```
@leave-policy-2024 How many sick days do I get?
```

**Query employee handbook:**
```
#employee-handbook-2024 What is the dress code for Fridays?
```

**Query without tag (searches all documents):**
```
What is the company's mission statement?
```

## Sample Documents Provided

### 1. Leave Policy (`@leave-policy-2024`)
**Location:** `sample_documents/leave_policy_2024.txt`

**Topics covered:**
- Annual leave entitlements
- Sick leave policy
- Casual leave
- Maternity/paternity leave  
- Leave application process
- Escalation procedures

**Example queries:**
- `@leave-policy-2024 What is the sick leave entitlement?`
- `@leave-policy-2024 How do I apply for emergency leave?`
- `#leave-policy-2024 What happens if my leave is rejected?`

### 2. Employee Handbook (`@employee-handbook-2024`)
**Location:** `sample_documents/employee_handbook_2024.txt`

**Topics covered:**
- Company values
- Work schedule & flexible hours
- Dress code
- Performance reviews
- Compensation & benefits
- Training & development
- Remote work policy

**Example queries:**
- `@employee-handbook-2024 What are the core company values?`
- `#employee-handbook-2024 Can I work remotely?`
- `@employee-handbook-2024 When are performance reviews conducted?`

## How It Works

1. **Tag Detection**: Chatbot detects `@` or `#` in your query
2. **Document Filter**: Extracts document ID (e.g., `leave-policy-2024`)
3. **Query Cleaning**: Removes tag from query for cleaner processing
4. **RAG Search**: Searches ONLY in the tagged document
5. **Response**: Returns answer with:
   - Answer text
   - Confidence score (0-100%)
   - Source citations

## Upload Your Own Documents

### Step 1: Upload via UI
1. Navigate to: Projects → (Select Project) → Documents
2. Click "Add Document"
3. Upload your `.txt` or `.md` file
4. Give it a clear title (e.g., "Remote Work Policy 2024")

### Step 2: Wait for Indexing
- System automatically indexes in ~30 seconds
- Check AI Gateway console for: `✅ Successfully ingested document`

### Step 3: Query with Tag
Use the document ID from upload:
```
@remote-work-policy-2024 Can I work from another country?
```

## Document ID Format

When you upload a document, the system automatically creates a document ID based on the title:

**Upload Title** → **Document ID**
- "Leave Policy 2024" → `leave-policy-2024`
- "Employee Handbook" → `employee-handbook`
- "Remote Work Guidelines" → `remote-work-guidelines`

**Tip:** Use descriptive, hyphenated titles for easy tagging!

## Benefits of Document Tagging

✅ **Faster Queries** - Searches only one document instead of all
✅ **More Accurate** - Higher confidence scores
✅ **Better Context** - AI knows exactly where to look
✅ **No Confusion** - Won't mix up info from different policies

## Without Tag vs With Tag

**Without Tag (searches all documents):**
```
What is the dress code?
```
Response might mix: leave policy dress code + handbook dress code

**With Tag (precise):**
```
@employee-handbook-2024 What is the dress code?
```
Response: Only from employee handbook, clear and accurate

## Troubleshooting

**"Document not found"**
- Check spelling of document ID
- Ensure document was uploaded and indexed
- Wait 30 seconds after upload

**"Out of scope"**
- Your question may not relate to document content
- Try rephrasing with more specific keywords

**Low confidence score**
- Question is too vague
- Information might not be in the document
- Try asking more specifically

## Advanced Usage

**Multiple documents (coming soon):**
```
@leave-policy-2024 @employee-handbook What are the holiday benefits?
```

**Metadata filtering (coming soon):**
```
@leave-policy-2024 department:HR What is the escalation process?
```

---

**Happy querying! 🚀**

For help, ask in chatbot: `How do I use document tags?`
