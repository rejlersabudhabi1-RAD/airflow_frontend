import React from 'react';
import { PageLayout } from '@/layouts/PageLayout';
import { MainHeader } from "../Common/MainHeader";
// Footer can be added if needed
import { LoadingState } from "../common/LoadingState";
import { ErrorState } from "../common/ErrorState";
import { EmptyDataState } from "../common/EmptyDataState";
import { useQHSESpotCheckRegister } from '../../hooks/useQHSESpotCheck';
import SpotCheckSummaryCards from './SpotCheckSummaryCards'; // Create this similar to DashSummaryCard/SummaryCards

const SpotCheckPage = () => {
  const { data: spotCheckData, loading, error, lastUpdated, refetch } = useQHSESpotCheckRegister();

  // Loading state
  if (loading) {
    return (
      <PageLayout>
        <MainHeader title="Spot Check Register" subtitle="Overview of all spot checks" />
        <LoadingState message="Loading spot check data..." />
      </PageLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <PageLayout>
        <MainHeader title="Spot Check Register" subtitle="Error loading spot check data" />
        <ErrorState error={error} onRetry={refetch} />
      </PageLayout>
    );
  }

  // Empty state
  if (!spotCheckData || spotCheckData.length === 0) {
    return (
      <PageLayout>
        <MainHeader title="Spot Check Register" subtitle="No spot check data available" />
        <EmptyDataState 
          title="No Spot Check Records"
          message="There are currently no spot check records in the system."
          troubleshootingSteps={[
            "Add new spot check records to the database",
            "Import spot check data from external sources",
            "Contact your QHSE administrator for data import"
          ]}
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <MainHeader
        title="Spot Check Register"
        subtitle="Overview of all spot checks"
        lastUpdated={lastUpdated}
        className="mb-4 sm:mb-5 md:mb-6"
      />
      <div className="space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-7 xl:space-y-8">
        {/* Summary Cards Section */}
        <section className="w-full">
          <SpotCheckSummaryCards spotCheckData={spotCheckData} />
        </section>
      </div>
   {/* Footer can be added if needed */}
       </PageLayout>
  );
};

export default SpotCheckPage;