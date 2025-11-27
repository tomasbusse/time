# Login Page & Settings Page Implementation Plan

## Overview
Create a comprehensive authentication and settings system with:
1. **Login Page**: Google OAuth integration
2. **Settings Page**: API key management for 6 services + user invitations

## API Services to Support
1. **OpenRouter** - AI model routing service
2. **Resend** - Email service for notifications
3. **OpenAI** - GPT models and embeddings
4. **Anthropic** - Claude models
5. **Google** - Already implemented (Calendar API)
6. **ElevenLabs** - Voice synthesis service

## 1. Login Page Implementation

### Frontend Design
```
components/auth/LoginPage.tsx
├── Hero section with app branding
├── Google OAuth login button
├── Feature highlights
└── Footer with terms/privacy links
```

### Authentication Flow
1. User visits `/login`
2. Clicks "Login with Google" 
3. Redirected to Google OAuth (existing calendar OAuth setup)
4. After OAuth success → redirect to `/dashboard`
5. User data stored in WorkspaceContext

### Routing Updates
- Add `/login` route
- Protect main app routes (redirect to login if not authenticated)
- Auto-redirect to dashboard after successful login

## 2. Settings Page Implementation

### User Sharing & Collaboration Features

#### Workspace Sharing System
```typescript
// Enhanced sharing functionality
workspaceSharing: defineTable({
  workspaceId: v.id("workspaces"),
  sharedBy: v.id("users"),
  sharedWithEmail: v.string(),
  sharedWithUserId: v.optional(v.id("users")), // null if not yet accepted
  accessLevel: v.union(
    v.literal("viewer"),     // View only
    v.literal("editor"),     // Add/Edit data
    v.literal("collaborator"), // Full access except settings
    v.literal("admin")       // Full access including settings
  ),
  status: v.union(
    v.literal("pending"),    // Invitation sent, awaiting acceptance
    v.literal("active"),     // User has accepted and has access
    v.literal("revoked"),    // Access revoked by sharer
    v.literal("expired")     // Invitation expired (7 days)
  ),
  message: v.optional(v.string()), // Personal message from sharer
  invitedAt: v.number(),
  expiresAt: v.number(),
  acceptedAt: v.optional(v.number()),
  lastAccessedAt: v.optional(v.number()),
}).index("by_workspace", ["workspaceId"])
```

#### Sharing Mechanisms

**1. Direct Email Invitation**
- Send personalized invitation email
- Include custom message from workspace owner
- Secure invitation token with 7-day expiration
- One-click acceptance process

**2. Share Link Generation**
```typescript
// Generate shareable workspace links
generateShareLink: action({
  args: {
    workspaceId: v.id("workspaces"),
    accessLevel: v.union(v.literal("viewer"), v.literal("editor")),
    expirationDays: v.number(),
    maxUses: v.optional(v.number()) // null = unlimited
  },
  handler: async (ctx, { workspaceId, accessLevel, expirationDays, maxUses }) => {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + (expirationDays * 24 * 60 * 60 * 1000);
    
    // Store in database
    await ctx.runMutation(api.workspaceSharing.createShareLink, {
      workspaceId,
      token,
      accessLevel,
      expiresAt,
      maxUses: maxUses ?? null,
      currentUses: 0
    });
    
    return `${window.location.origin}/join/${token}`;
  }
});
```

**3. Collaborative Features**
- **Real-time Activity Feed**: Show what collaborators are doing
- **Comment System**: Add comments to shared data
- **Permission Granularity**: Different access levels per module
- **Activity Notifications**: Email updates on workspace changes

#### Sharing UI Components
```
src/components/sharing/
├── ShareWorkspaceModal.tsx    // Main sharing interface
├── InviteByEmail.tsx          // Email invitation form
├── ShareLinkGenerator.tsx     // Generate shareable links
├── SharedUsersList.tsx        // Manage existing collaborators
├── PermissionManager.tsx      // Edit access levels
└── SharingActivityFeed.tsx    // Activity timeline
```

#### Invitation Email Templates
```typescript
const sharingInvitationEmail = (
  workspaceName: string,
  sharedByName: string,
  accessLevel: string,
  message: string | undefined,
  inviteLink: string,
  expiryDate: Date
) => ({
  subject: `${sharedByName} shared "${workspaceName}" with you`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">You've been invited to collaborate!</h2>
      
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>${sharedByName}</strong> has shared the workspace "<em>${workspaceName}</em>" with you.</p>
        
        ${message ? `<blockquote style="border-left: 4px solid #e2e8f0; padding-left: 16px; margin: 16px 0; font-style: italic;">"${message}"</blockquote>` : ''}
        
        <p><strong>Your access level:</strong> ${accessLevel}</p>
        <p><strong>This invitation expires:</strong> ${expiryDate.toLocaleDateString()}</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${inviteLink}" 
           style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Accept Invitation
        </a>
      </div>
      
      <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
        <h3 style="color: #374151;">What is LifeHub?</h3>
        <p>LifeHub is a comprehensive productivity platform that combines:</p>
        <ul>
          <li>Time tracking and allocation</li>
          <li>Financial management and budgeting</li>
          <li>Task and project management</li>
          <li>Recipe and meal planning</li>
          <li>Calendar synchronization</li>
          <li>Idea capture and organization</li>
        </ul>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        If you're having trouble with the button above, copy and paste this link into your browser:<br>
        <a href="${inviteLink}" style="color: #2563eb;">${inviteLink}</a>
      </p>
    </div>
  `
});
```

#### Share Link Landing Page
```
src/components/join/
├── JoinWorkspacePage.tsx       // Handle share link access
├── LoginPrompt.tsx            // Show if user not logged in
├── AcceptInvitation.tsx       // Handle invitation acceptance
└── AccessDenied.tsx           // Show if invitation expired/invalid
```

#### Collaborative Features

**1. Activity Timeline**
```typescript
// Track all workspace activities for collaborators
workspaceActivity: defineTable({
  workspaceId: v.id("workspaces"),
  userId: v.id("users"),
  action: v.string(), // "created_task", "updated_finance", "added_recipe", etc.
  targetType: v.string(), // "task", "transaction", "recipe", etc.
  targetId: v.string(),
  description: v.string(),
  metadata: v.optional(v.string()), // JSON string for additional data
  createdAt: v.number(),
}).index("by_workspace_date", ["workspaceId", "createdAt"])
```

**2. Real-time Notifications**
- Push notifications for important activities
- Email digest for daily/weekly summaries
- In-app notification center
- Customizable notification preferences

**3. Module-Specific Sharing**
```typescript
// Granular permissions per module
modulePermissions: defineTable({
  workspaceId: v.id("workspaces"),
  userId: v.id("users"),
  module: v.union(
    v.literal("time"),
    v.literal("finance"),
    v.literal("flow"),
    v.literal("food"),
    v.literal("calendar"),
    v.literal("ideas")
  ),
  permissions: v.object({
    view: v.boolean(),
    add: v.boolean(),
    edit: v.boolean(),
    delete: v.boolean(),
    share: v.boolean()
  }),
  createdAt: v.number(),
  updatedAt: v.number(),
}).index("by_user_module", ["userId", "module"])
```

#### Sharing Management Dashboard
```
Settings Page > Sharing & Collaboration
├── Active Collaborators
│   ├── User list with access levels
│   ├── Last activity indicators
│   └── Action buttons (edit permissions, revoke access)
├── Pending Invitations
│   ├── Email invitations sent
│   ├── Share links generated
│   └── Resend/expire options
├── Activity Feed
│   ├── Recent collaborator actions
│   ├── Workspace changes
│   └── Notifications
└── Sharing Settings
    ├── Default permissions for new users
    ├── Module-specific access control
    └── Notification preferences
```

#### Security & Privacy
- **Workspace Isolation**: Each workspace is completely separate
- **Data Encryption**: All shared data encrypted at rest
- **Audit Trail**: Complete log of all sharing activities
- **Revocation**: Immediate access removal when sharing revoked
- **Expiration**: Automatic cleanup of expired invitations
- **IP Tracking**: Log IP addresses for security monitoring

#### Mobile Sharing Features
- **QR Code Generation**: Quick sharing via QR codes
- **SMS Invitations**: Send invitations via text message
- **Social Media Sharing**: Share workspace links on social platforms
- **Contact Integration**: Import contacts for easy sharing

This enhanced sharing system provides comprehensive collaboration features while maintaining security and privacy controls.

### Database Schema Updates
```typescript
// New tables for API management
apiKeys: defineTable({
  userId: v.id("users"),
  serviceName: v.string(), // "openrouter", "resend", etc.
  apiKey: v.string(), // encrypted
  isActive: v.boolean(),
  lastTested: v.number(),
  testStatus: v.union(v.literal("success"), v.literal("failed"), v.literal("untested")),
  testError: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
}).index("by_user_service", ["userId", "serviceName"])

userInvitations: defineTable({
  workspaceId: v.id("workspaces"),
  invitedBy: v.id("users"),
  email: v.string(),
  status: v.union(
    v.literal("pending"),
    v.literal("accepted"),
    v.literal("expired")
  ),
  role: v.union(v.literal("user"), v.literal("admin")),
  invitedAt: v.number(),
  expiresAt: v.number(),
  acceptedAt: v.optional(v.number()),
}).index("by_workspace", ["workspaceId"])
```

### Frontend Structure
```
src/apps/settings/
├── SettingsPage.tsx
├── components/
│   ├── ApiKeyManager.tsx
│   ├── UserInvitations.tsx
│   ├── ProfileSettings.tsx
│   └── ApiTestModal.tsx
└── hooks/
    ├── useApiKeys.ts
    └── useUserInvitations.ts
```

### API Key Management Features

#### Service Configuration
```typescript
interface ApiServiceConfig {
  name: string;
  displayName: string;
  placeholder: string;
  helpText: string;
  testEndpoint?: string;
  testMethod: "GET" | "POST";
  testHeaders?: Record<string, string>;
  testBody?: any;
}

const API_SERVICES: Record<string, ApiServiceConfig> = {
  openrouter: {
    name: "openrouter",
    displayName: "OpenRouter",
    placeholder: "sk-or-v1-...",
    helpText: "Get your API key from https://openrouter.ai/keys",
    testEndpoint: "https://openrouter.ai/api/v1/models",
    testMethod: "GET",
    testHeaders: { "Authorization": "Bearer {apiKey}" }
  },
  resend: {
    name: "resend",
    displayName: "Resend",
    placeholder: "re_...",
    helpText: "Get your API key from https://resend.com/api-keys",
    testEndpoint: "https://api.resend.com/domains",
    testMethod: "GET",

#### App Sharing & Growth Features

**1. Refer-a-Friend System**
```typescript
// Track referrals for growth and rewards
userReferrals: defineTable({
  referrerId: v.id("users"),
  referredEmail: v.string(),
  referredUserId: v.optional(v.id("users")), // filled when they sign up
  status: v.union(
    v.literal("pending"),    // Invitation sent
    v.literal("signed_up"),  // User created account
    v.literal("activated"),  // User completed onboarding
    v.literal("converted")   // User became active user
  ),
  referralCode: v.string(), // unique per referrer
  invitedAt: v.number(),
  signedUpAt: v.optional(v.number()),
  activatedAt: v.optional(v.number()),
}).index("by_referrer", ["referrerId"])
```

**2. Social Media Integration**
- Share workspace achievements on social platforms
- Generate beautiful share cards for progress milestones
- "Built with LifeHub" branding on shared content
- LinkedIn, Twitter, Facebook sharing buttons

**3. QR Code Sharing**
```typescript
// Generate QR codes for easy mobile sharing
generateWorkspaceQR: action({
  args: {
    workspaceId: v.id("workspaces"),
    accessLevel: v.union(v.literal("viewer"), v.literal("editor"))
  },
  handler: async (ctx, { workspaceId, accessLevel }) => {
    const shareLink = await generateShareLink({ workspaceId, accessLevel, expirationDays: 30 });
    const qrCode = await generateQRCode(shareLink);
    return { shareLink, qrCode };
  }
});
```

**4. Contact Integration**
- Import contacts from Google/Apple/Outlook
- Send batch invitations to selected contacts
- Track invitation delivery and acceptance rates
- Reminder system for pending invitations

**5. Public Workspace Showcase**
- Optional public workspace pages
- Showcase productivity achievements
-模板 and workflow sharing
- Community features and ratings

#### Sharing Analytics & Insights
```typescript
// Track sharing effectiveness
sharingAnalytics: defineTable({
  workspaceId: v.id("workspaces"),
  metric: v.string(), // "invitations_sent", "links_created", "signups", "active_collaborators"
  value: v.number(),
  date: v.number(), // YYYY-MM-DD format
  metadata: v.optional(v.string()), // JSON for additional data
}).index("by_workspace_date", ["workspaceId", "date"])
```

**Metrics to Track:**
- Invitation send/accept rates
- Link click-through rates  
- User activation after invitation
- Collaboration activity levels
- Most effective sharing channels
- Retention rates for invited users

This comprehensive sharing system covers both collaborative workspace sharing and app growth through referrals and social sharing.
    testHeaders: { "Authorization": "Bearer {apiKey}" }
  },
  openai: {
    name: "openai",
    displayName: "OpenAI",
    placeholder: "sk-...",
    helpText: "Get your API key from https://platform.openai.com/api-keys",
    testEndpoint: "https://api.openai.com/v1/models",
    testMethod: "GET",
    testHeaders: { "Authorization": "Bearer {apiKey}" }
  },
  anthropic: {
    name: "anthropic",
    displayName: "Anthropic",
    placeholder: "sk-ant-...",
    helpText: "Get your API key from https://console.anthropic.com/",
    testEndpoint: "https://api.anthropic.com/v1/messages",
    testMethod: "POST",
    testHeaders: { 
      "Authorization": "Bearer {apiKey}",
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01"
    },
    testBody: { "model": "claude-3-haiku-20240307", "max_tokens": 10, "messages": [{"role": "user", "content": "Hi"}] }
  },
  google: {
    name: "google",
    displayName: "Google",
    placeholder: "Google API credentials",
    helpText: "OAuth2 already configured for Calendar access",
    testEndpoint: "https://www.googleapis.com/oauth2/v1/userinfo",
    testMethod: "GET",
    testHeaders: { "Authorization": "OAuth {apiKey}" }
  },
  elevenlabs: {
    name: "elevenlabs",
    displayName: "ElevenLabs",
    placeholder: "...",
    helpText: "Get your API key from https://elevenlabs.io/speech-synthesis",
    testEndpoint: "https://api.elevenlabs.io/v1/user",
    testMethod: "GET",
    testHeaders: { "xi-api-key": "{apiKey}" }
  }
};
```

#### API Key Management UI
- **Add/Edit Modal**: Form for entering API keys
- **Service List**: Card layout showing each service
- **Test Button**: Test API connectivity
- **Show/Hide Toggle**: Toggle API key visibility
- **Status Indicator**: Success/Failed/Testing states
- **Last Tested**: Timestamp of last successful test

#### API Testing System
```typescript
// Backend testing functions
export const testApiKey = action({
  args: {
    serviceName: v.string(),
    apiKey: v.string()
  },
  handler: async (ctx, { serviceName, apiKey }) => {
    const config = API_SERVICES[serviceName];
    const headers = config.testHeaders ? 
      Object.fromEntries(
        Object.entries(config.testHeaders).map(([key, value]) => 
          [key, value.replace("{apiKey}", apiKey)]
        )
      ) : {};
    
    const response = await fetch(config.testEndpoint, {
      method: config.testMethod,
      headers,
      ...(config.testBody && { body: JSON.stringify(config.testBody) })
    });
    
    return {
      success: response.ok,
      status: response.status,
      error: response.ok ? null : await response.text()
    };
  }
});
```

### User Invitation System

#### Invitation Flow
1. **Workspace Owner/Admin** can invite users
2. **Invitation Email** sent via Resend API
3. **Acceptance Flow** with Google OAuth
4. **Permission Assignment** based on inviter's role

#### Email Templates
```typescript
// Using Resend API for invitations
interface InvitationEmail {
  to: string;
  subject: string;
  html: string;
  template?: string;
}

const invitationEmail = (workspaceName: string, invitedBy: string, inviteLink: string) => ({
  subject: `You've been invited to ${workspaceName}`,
  html: `
    <h2>You're invited!</h2>
    <p><strong>${invitedBy}</strong> has invited you to join <strong>${workspaceName}</strong> on LifeHub.</p>
    <p>LifeHub is a comprehensive productivity platform with time tracking, financial management, task flow, and more.</p>
    <a href="${inviteLink}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
      Accept Invitation
    </a>
    <p>This invitation expires in 7 days.</p>
  `
});
```

#### Invitation Management UI
- **Invite Form**: Email input with role selection
- **Pending Invitations**: List with resend/delete options
- **Accepted Users**: User management with role changes
- **Invitation History**: Audit trail

## 3. Implementation Steps

### Phase 1: Database & Backend
1. Add new tables to schema
2. Create API key management functions
3. Implement invitation system functions
4. Add API testing utilities

### Phase 2: Login Page
1. Create LoginPage component
2. Implement authentication flow
3. Add route protection
4. Update navigation

### Phase 3: Settings Page
1. Create SettingsPage layout
2. Implement API key manager
3. Add user invitation system
4. Create profile settings

### Phase 4: Integration & Testing
1. Connect all components
2. Test OAuth flows
3. Test API integrations
4. Security audit

## 4. Security Considerations

### API Key Security
- **Encryption**: Store API keys encrypted in database
- **Masking**: Never log or expose API keys
- **Permissions**: Only workspace owners/admins can manage API keys
- **Validation**: Test API keys before storing

### User Invitation Security
- **Token Validation**: Secure invitation tokens
- **Expiration**: 7-day expiration for invitations
- **Role Validation**: Inviter must have sufficient permissions
- **Audit Trail**: Log all invitation activities

### Access Control
- **Route Protection**: All main routes require authentication
- **Role-Based Access**: Different permissions for owners/admins/users
- **Workspace Isolation**: Users only see their workspace data
- **API Key Isolation**: Users only see their own API keys

## 5. Technology Integration

### Resend API Integration
```typescript
// Email service integration
const sendInvitationEmail = async (emailData: InvitationEmail) => {
  const apiKey = await getApiKey("resend");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: "LifeHub <noreply@lifehub.app>",
      to: [emailData.to],
      subject: emailData.subject,
      html: emailData.html
    })
  });
  return response.json();
};
```

### API Key Encryption
```typescript
// Encrypt/decrypt API keys
const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.API_KEY_ENCRYPTION_KEY;

export const encryptApiKey = (apiKey: string): string => {
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

export const decryptApiKey = (encryptedKey: string): string => {
  const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
  let decrypted = decipher.update(encryptedKey, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};
```

## 6. User Experience Flow

### New User Onboarding
1. **Landing**: User visits app → redirected to login
2. **Authentication**: Google OAuth login
3. **Workspace Creation**: Auto-create personal workspace
4. **Settings Setup**: Prompt to add API keys
5. **Dashboard**: Redirect to main app

### Settings Discovery
- **First Visit**: Guided tour of settings features
- **API Setup**: Helpful tooltips for each service
- **Invitation Flow**: Clear role explanations
- **Testing Feedback**: Real-time status updates

## 7. Deployment Considerations

### Environment Variables
```env
# New environment variables needed
API_KEY_ENCRYPTION_KEY=your-32-char-encryption-key
RESEND_API_KEY=re_... (for invitations)
OPENROUTER_API_KEY=sk-or-v1-...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
ELEVENLABS_API_KEY=...
GOOGLE_CLIENT_ID=... (already exists)
GOOGLE_CLIENT_SECRET=... (already exists)
```

### Migration Strategy
1. **Backup**: Full database backup before schema changes
2. **Migration**: Add new tables and indexes
3. **Rollback Plan**: Prepared for quick rollback if needed
4. **Testing**: Comprehensive testing in staging

This comprehensive plan covers all aspects of the login and settings implementation with extensive API management and user invitation capabilities.