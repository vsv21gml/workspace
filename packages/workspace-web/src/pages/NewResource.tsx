import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { createResource } from '@/lib/api';

export default function NewResource() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      cpu: '0',  // 무제한
      memory: '0',  // 무제한
      label: formData.get('label') as string,
      description: formData.get('description') as string,
      namespace: formData.get('namespace') as string || 'workspace',
      ingressClass: formData.get('ingressClass') as string || 'nginx',
    };

    try {
      await createResource(data);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '리소스 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">새 리소스 생성</h1>
          <p className="mt-1 text-sm text-gray-500">새로운 리소스를 생성하고 관리할 수 있습니다.</p>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <strong className="font-bold">오류 발생!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="space-y-6">
            <div>
              <label htmlFor="label" className="block text-sm font-medium text-gray-700 mb-1">
                라벨
              </label>
              <input
                type="text"
                id="label"
                name="label"
                placeholder="리소스를 식별할 수 있는 라벨을 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                설명
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                placeholder="리소스에 대한 설명을 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label htmlFor="namespace" className="block text-sm font-medium text-gray-700 mb-1">
                네임스페이스 <span className="text-gray-500">(기본값: workspace)</span>
              </label>
              <input
                type="text"
                id="namespace"
                name="namespace"
                defaultValue="workspace"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label htmlFor="ingressClass" className="block text-sm font-medium text-gray-700 mb-1">
                Ingress 클래스 <span className="text-gray-500">(기본값: nginx)</span>
              </label>
              <input
                type="text"
                id="ingressClass"
                name="ingressClass"
                defaultValue="nginx"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/')}
              disabled={loading}
              className="px-6"
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 text-white px-6"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  생성 중...
                </div>
              ) : (
                '생성하기'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 