import ProductForm from '@/components/admin/ProductForm'

export default function NewProductPage() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-ink text-title font-serif">새 상품</h1>
      <ProductForm />
    </div>
  )
}
