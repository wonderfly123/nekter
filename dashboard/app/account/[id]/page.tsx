import { PageContainer } from '@/components/layout/page-container';

export default function AccountDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <PageContainer>
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Account Detail: {params.id}
          </h2>
          <p className="text-gray-600">
            Implementation in progress - Part 3
          </p>
        </div>
      </div>
    </PageContainer>
  );
}
