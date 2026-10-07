import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ActionChipProps {
  icon: LucideIcon
  iconColor: string
  label: string
  disabled?: boolean
  onClick?: () => void
}

export function ActionChip({
  icon: Icon,
  iconColor,
  label,
  disabled,
  onClick,
}: ActionChipProps) {
  return (
    <Button
      variant="outline"
      disabled={disabled}
      onClick={onClick}
      className="h-8 gap-1.5 rounded-full px-4 font-normal"
    >
      <Icon className="size-4" style={{ color: iconColor }} />
      {label}
    </Button>
  )
}
