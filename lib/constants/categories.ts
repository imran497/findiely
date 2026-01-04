export const CATEGORIES = [
  { label: 'SaaS', value: 'saas' },
  { label: 'Payments', value: 'payments' },
  { label: 'Productivity', value: 'productivity' },
  { label: 'Analytics', value: 'analytics' },
  { label: 'AI', value: 'ai' },
  { label: 'Design', value: 'design' },
  { label: 'Development', value: 'development' },
  { label: 'Marketing', value: 'marketing' },
  { label: 'Finance', value: 'finance' },
  { label: 'E-commerce', value: 'ecommerce' },
  { label: 'Communication', value: 'communication' },
  { label: 'Education', value: 'education' },
  { label: 'Security', value: 'security' },
  { label: 'DevOps', value: 'devops' },
  { label: 'Content', value: 'content' },
] as const

export type CategoryValue = typeof CATEGORIES[number]['value']
