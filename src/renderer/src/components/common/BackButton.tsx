import { ArrowLeft } from 'lucide-react'
import { useAppStore } from '../../store'

interface BackButtonProps {
  onClick: () => void
}

export default function BackButton({ onClick }: BackButtonProps) {
  const { t } = useAppStore()

  return (
    <button className="back-button" onClick={onClick} type="button">
      <span className="back-button-text">{t('common.back')}</span>
      <span className="back-button-icon-wrapper">
        <ArrowLeft className="back-button-icon" size={15} strokeWidth={2.5} />
      </span>
    </button>
  )
}
