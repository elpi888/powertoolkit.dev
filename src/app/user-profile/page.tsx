// src/app/user-profile/page.tsx
import { UserProfile } from "@clerk/nextjs";
// import { dark } from "@clerk/themes"; // Optional: Removed unused import

const UserProfilePage = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)' }}> {/* Basic centering */}
    <UserProfile
      path="/user-profile" // Base path for the UserProfile component
      routing="path"     // Use path-based routing
      appearance={{
        // baseTheme: dark, // Ensure this is removed or 'dark' is defined if used
        // You can customize the appearance further if needed.
        // For example, to match your app's theme:
        // variables: { colorPrimary: '#yourAppPrimaryColor' },
        elements: {
          card: "shadow-none bg-transparent", // Example: remove default card shadow, make bg transparent
          navbar: "hidden", // Example: hide the internal navbar if you have global nav
          navbarMobileMenuButton: "text-primary", // Example
          headerTitle: "text-primary", // Example
          // Add other element customizations if desired
        }
      }}
    />
  </div>
);

export default UserProfilePage;
