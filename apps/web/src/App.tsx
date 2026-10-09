import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from './layouts/PublicLayout.js';
import { StaffDashboardLayout } from './layouts/StaffDashboardLayout.js';
import { MemberPWALayout } from './layouts/MemberPWALayout.js';

// Pages
import { LandingPage } from './pages/LandingPage.js';
import { FeaturesPage } from './pages/FeaturesPage.js';
import { PricingPage } from './pages/PricingPage.js';
import { ContactPage } from './pages/ContactPage.js';
import { BlogPage } from './pages/BlogPage.js';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage.js';
import { TermsPage } from './pages/TermsPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage.js';
import { ResetPasswordPage } from './pages/ResetPasswordPage.js';
import { VerifyEmailPage } from './pages/VerifyEmailPage.js';
import { DashboardOverviewPage } from './pages/DashboardOverviewPage.js';
import { MembersListPage } from './pages/MembersListPage.js';
import { IntegrationsSettingsPage } from './pages/IntegrationsSettingsPage.js';
import { MemberPortalPage } from './pages/MemberPortalPage.js';
import { CrmPage } from './pages/CrmPage.js';
import { ClassesPage } from './pages/ClassesPage.js';
import { TrainersPage } from './pages/TrainersPage.js';
import { WorkoutsPage } from './pages/WorkoutsPage.js';
import { NutritionPage } from './pages/NutritionPage.js';
import { CommunicationPage } from './pages/CommunicationPage.js';
import { MarketingPage } from './pages/MarketingPage.js';
import { AiAnalyticsPage } from './pages/AiAnalyticsPage.js';
import { MultiBranchPage } from './pages/MultiBranchPage.js';
import { InventoryExpensesPage } from './pages/InventoryExpensesPage.js';
import { SuperAdminPage } from './pages/SuperAdminPage.js';
import { TenantPublicSitePage } from './pages/TenantPublicSitePage.js';
import { NotFoundPage } from './pages/NotFoundPage.js';
import { ServerErrorPage } from './pages/ServerErrorPage.js';

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsPage />} />
      </Route>

      {/* Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      {/* Staff Management Console */}
      <Route element={<StaffDashboardLayout />}>
        <Route path="/dashboard" element={<DashboardOverviewPage />} />
        <Route path="/members" element={<MembersListPage />} />
        <Route path="/memberships" element={<DashboardOverviewPage />} />
        <Route path="/attendance" element={<DashboardOverviewPage />} />
        <Route path="/billing" element={<DashboardOverviewPage />} />
        <Route path="/crm" element={<CrmPage />} />
        <Route path="/classes" element={<ClassesPage />} />
        <Route path="/trainers" element={<TrainersPage />} />
        <Route path="/workouts" element={<WorkoutsPage />} />
        <Route path="/nutrition" element={<NutritionPage />} />
        <Route path="/communication" element={<CommunicationPage />} />
        <Route path="/marketing" element={<MarketingPage />} />
        <Route path="/analytics" element={<AiAnalyticsPage />} />
        <Route path="/multi-branch" element={<MultiBranchPage />} />
        <Route path="/inventory-expenses" element={<InventoryExpensesPage />} />
        <Route path="/super-admin" element={<SuperAdminPage />} />
        <Route path="/settings/integrations" element={<IntegrationsSettingsPage />} />
        <Route path="/settings/roles" element={<IntegrationsSettingsPage />} />
        <Route path="/settings/branch" element={<IntegrationsSettingsPage />} />
      </Route>

      {/* Member Digital PWA */}
      <Route element={<MemberPWALayout />}>
        <Route path="/member-portal" element={<MemberPortalPage />} />
      </Route>

      {/* Branded Public Gym Site per Tenant */}
      <Route path="/gym" element={<TenantPublicSitePage />} />
      <Route path="/gym/:slug" element={<TenantPublicSitePage />} />

      {/* Error Routes */}
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="/500" element={<ServerErrorPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default App;
