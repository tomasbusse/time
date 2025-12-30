# Time Project - Agent Instructions

## Project Overview
This is a time management/tracking application built with:
- **Frontend**: React + TypeScript + Vite
- **Backend**: Convex
- **Styling**: Tailwind CSS
- **Authentication**: Convex Auth

## Current Task Requirements

### User Authentication System
Implement a login system with the following requirements:

1. **Two-User Login System**
   - Support login for two separate users
   - Use **Convex Auth** for authentication (already configured in project)
   - Secure password storage using Convex Auth best practices

2. **Password Management**
   - Allow users to change their password once logged in
   - Implement password change form in settings/profile area
   - Validate password strength
   - Confirm old password before allowing change

3. **Code Quality Standards**
   - Write clean, maintainable TypeScript code
   - Follow existing project conventions
   - No excessive AI comments (code should look human-written)
   - Proper error handling and user feedback
   - Type-safe implementations

4. **Git Integration**
   - Commit changes with clear, descriptive messages
   - Push to GitHub repository: https://github.com/tomasbusse/Time/
   - Ensure all changes are properly staged and committed

## Implementation Guidelines

- Use existing Convex auth configuration (check `convex/auth.config.ts` or similar)
- Maintain consistent UI/UX with existing components
- Add proper loading states and error messages
- Test authentication flow thoroughly before pushing
- Follow security best practices for password handling

## Existing Tech Stack Context

The project already has:
- Convex backend (see `convex/` directory)
- React frontend with TypeScript
- Tailwind CSS for styling
- GitHub repository configured

## Important Notes

- **Do NOT** add excessive comments in code
- **DO** use existing design patterns and component structure
- **DO** ensure proper TypeScript types throughout
- **DO** test the authentication flow before committing
