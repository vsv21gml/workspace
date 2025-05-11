import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getResources, deleteResource, WorkspaceResource } from '@/lib/api'
import NewResource from '@/pages/NewResource'

function ResourceList() {
  const [resources, setResources] = useState<WorkspaceResource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadResources = async () => {
    try {
      const data = await getResources()
      setResources(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : '리소스 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadResources()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('정말로 이 리소스를 삭제하시겠습니까?')) return
    
    try {
      await deleteResource(id)
      await loadResources()
    } catch (err) {
      setError(err instanceof Error ? err.message : '리소스 삭제에 실패했습니다.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">오류 발생!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">리소스 관리</h1>
          <p className="mt-1 text-sm text-gray-500">생성된 리소스 목록을 확인하고 관리할 수 있습니다.</p>
        </div>
        <Link to="/new">
          <Button className="bg-green-500 hover:bg-green-600 text-white">
            + 새 리소스 생성
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100 hover:bg-gray-100 border-b-2 border-gray-200">
              <TableHead className="w-[100px] py-4 text-gray-700 font-semibold border-r border-gray-200">CPU</TableHead>
              <TableHead className="w-[100px] py-4 text-gray-700 font-semibold border-r border-gray-200">메모리</TableHead>
              <TableHead className="w-[150px] py-4 text-gray-700 font-semibold border-r border-gray-200">라벨</TableHead>
              <TableHead className="py-4 text-gray-700 font-semibold border-r border-gray-200">설명</TableHead>
              <TableHead className="w-[120px] py-4 text-gray-700 font-semibold border-r border-gray-200">네임스페이스</TableHead>
              <TableHead className="w-[120px] py-4 text-gray-700 font-semibold border-r border-gray-200">Ingress 클래스</TableHead>
              <TableHead className="w-[150px] py-4 text-gray-700 font-semibold border-r border-gray-200">생성일</TableHead>
              <TableHead className="w-[150px] py-4 text-gray-700 font-semibold border-r border-gray-200">수정일</TableHead>
              <TableHead className="w-[100px] py-4 text-center text-gray-700 font-semibold">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resources.map((resource, index) => (
              <TableRow 
                key={resource.id} 
                className={`hover:bg-gray-50 transition-colors duration-150 ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                } ${
                  index !== resources.length - 1 ? 'border-b border-gray-200' : ''
                }`}
              >
                <TableCell className="py-4 text-gray-700 border-r border-gray-200">{resource.cpu}</TableCell>
                <TableCell className="py-4 text-gray-700 border-r border-gray-200">{resource.memory}</TableCell>
                <TableCell className="py-4 text-gray-700 border-r border-gray-200">{resource.label || '-'}</TableCell>
                <TableCell className="py-4 text-gray-700 max-w-[200px] truncate border-r border-gray-200">{resource.description || '-'}</TableCell>
                <TableCell className="py-4 text-gray-700 border-r border-gray-200">{resource.namespace}</TableCell>
                <TableCell className="py-4 text-gray-700 border-r border-gray-200">{resource.ingressClass}</TableCell>
                <TableCell className="py-4 text-gray-700 border-r border-gray-200">{new Date(resource.created_at).toLocaleString()}</TableCell>
                <TableCell className="py-4 text-gray-700 border-r border-gray-200">{new Date(resource.updated_at).toLocaleString()}</TableCell>
                <TableCell className="py-4">
                  <div className="flex justify-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(resource.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300 transition-colors duration-150"
                    >
                      삭제
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-xl font-bold">Workspace Manager</h1>
          </div>
        </header>

        <main>
          <Routes>
            <Route path="/" element={<ResourceList />} />
            <Route path="/new" element={<NewResource />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}
