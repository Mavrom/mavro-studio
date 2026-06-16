import { ArrowLeft } from 'lucide-react'
import { useAppStore } from '../../store'

export default function BackButton() {
  const { t, setActivePage } = useAppStore()

  return (
    <button className="back-button" onClick={() => setActivePage('home')} type="button">
      <span className="back-button-icon-wrapper">
        <ArrowLeft className="back-button-icon" size={15} strokeWidth={2.5} />
      </span>
      <span className="back-button-text">{t('common.back')}</span>
    </button>
  )
}
