import { useState } from 'react'
import { useAppStore } from '../store'
import {
  Sparkles,
  Languages,
  Palette,
  UserRound,
  FolderOpen,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Check,
  ShieldCheck,
  Zap,
  Layers,
  Rocket,
  Moon,
  Sun,
  MonitorCog
} from 'lucide-react'

interface SetupProps {
  onComplete: () => void
}

type StepId = 'welcome' | 'preferences' | 'profile' | 'paths' | 'ready'

const STEPS: { id: StepId; icon: React.ReactNode; titleKey: string; subKey: string }[] = [
  { id: 'welcome',     icon: <Sparkles size={15} />,   titleKey: 'setup.steps.welcome',     subKey: 'setup.steps.welcomeSub' },
  { id: 'preferences', icon: <Palette size={15} />,    titleKey: 'setup.steps.preferences', subKey: 'setup.steps.preferencesSub' },
  { id: 'profile',     icon: <UserRound size={15} />,  titleKey: 'setup.steps.profile',     subKey: 'setup.steps.profileSub' },
  { id: 'paths',       icon: <FolderOpen size={15} />, titleKey: 'setup.steps.paths',       subKey: 'setup.steps.pathsSub' },
  { id: 'ready',       icon: <Rocket size={15} />,     titleKey: 'setup.steps.ready',       subKey: 'setup.steps.readySub' },
]

export default function Setup({ onComplete }: SetupProps) {
  const { t, theme, setTheme, language, setLanguage } = useAppStore()
  const [stepIndex, setStepIndex] = useState(0)
  const [finishing, setFinishing] = useState(false)

  const [profileName, setProfileName] = useState('')
  const [profileEmail, setProfileEmail] = useState('')
  const [exportPath, setExportPath] = useState('')
  const [dataDir, setDataDir] = useState('')

  const step = STEPS[stepIndex]
  const isFirst = stepIndex === 0
  const isLast = stepIndex === STEPS.length - 1

  const next = () => setStepIndex((i) => Math.min(i + 1, STEPS.length - 1))
  const prev = () => setStepIndex((i) => Math.max(i - 1, 0))

  const pickDir = async (setter: (v: string) => void) => {
    if (window.api) {
      const path = await window.api.openDirectory()
      if (path) setter(path)
    }
  }

  const finish = async () => {
    setFinishing(true)
    try {
      if (window.api) {
        await Promise.all([
          window.api.setSetting('profileName', profileName),
          window.api.setSetting('profileEmail', profileEmail),
          window.api.setSetting('defaultExportPath', exportPath),
          dataDir ? window.api.setSetting('dataDirectory', dataDir) : Promise.resolve(),
          window.api.setSetting('setupComplete', true),
        ])
      }
    } catch {
      /* persistence is best-effort; never block entry */
    }
    onComplete()
  }

  const themeOptions = [
    { value: 'dark' as const,   label: t('settings.themeDark'),   icon: <Moon size={16} /> },
    { value: 'light' as const,  label: t('settings.themeLight'),  icon: <Sun size={16} /> },
    { value: 'system' as const, label: t('settings.themeSystem'), icon: <MonitorCog size={16} /> },
  ]

  return (
    <div className="setup">
      {/* ── Aside: step rail ── */}
      <aside className="setup-aside">
        <div className="setup-brand">
          <div className="setup-brand-logo">M</div>
          <div>
            <div className="setup-brand-name">{t('app.name')}</div>
            <div className="setup-brand-tag">{t('setup.brandTag')}</div>
          </div>
        </div>

        <div className="setup-steps">
          {STEPS.map((s, i) => {
            const state = i === stepIndex ? 'active' : i < stepIndex ? 'done' : ''
            return (
              <div key={s.id} className={`setup-step ${state}`}>
                <div className="setup-step-dot">
                  {i < stepIndex ? <Check size={14} /> : i + 1}
                </div>
                <div className="setup-step-text">
                  <span className="setup-step-title">{t(s.titleKey)}</span>
                  <span className="setup-step-sub">{t(s.subKey)}</span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="setup-aside-footer">{t('setup.asideFooter')}</div>
      </aside>

      {/* ── Main: panel ── */}
      <div className="setup-main">
        <div className="setup-body">
          <div className="setup-panel" key={step.id}>

            {step.id === 'welcome' && (
              <>
                <div className="setup-hero-logo">M</div>
                <div className="setup-eyebrow">{t('setup.welcome.eyebrow')}</div>
                <h1 className="setup-title">{t('setup.welcome.title')}</h1>
                <p className="setup-subtitle">{t('setup.welcome.subtitle')}</p>
                <div>
                  <div className="setup-feature-row">
                    <div className="setup-feature-icon"><Layers size={18} /></div>
                    <div>
                      <div className="setting-row-label">{t('setup.welcome.feature1')}</div>
                      <div className="form-hint">{t('setup.welcome.feature1Desc')}</div>
                    </div>
                  </div>
                  <div className="setup-feature-row">
                    <div className="setup-feature-icon"><Zap size={18} /></div>
                    <div>
                      <div className="setting-row-label">{t('setup.welcome.feature2')}</div>
                      <div className="form-hint">{t('setup.welcome.feature2Desc')}</div>
                    </div>
                  </div>
                  <div className="setup-feature-row">
                    <div className="setup-feature-icon"><ShieldCheck size={18} /></div>
                    <div>
                      <div className="setting-row-label">{t('setup.welcome.feature3')}</div>
                      <div className="form-hint">{t('setup.welcome.feature3Desc')}</div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {step.id === 'preferences' && (
              <>
                <div className="setup-eyebrow">{t('setup.preferences.eyebrow')}</div>
                <h1 className="setup-title">{t('setup.preferences.title')}</h1>
                <p className="setup-subtitle">{t('setup.preferences.subtitle')}</p>
                <div className="setup-fields">
                  <div className="field">
                    <label className="form-label">
                      <span className="flex items-center gap-2"><Languages size={15} /> {t('settings.language')}</span>
                    </label>
                    <div className="segmented full">
                      <button
                        className={`segmented-item ${language === 'tr' ? 'active accent' : ''}`}
                        onClick={() => setLanguage('tr')}
                      >Türkçe</button>
                      <button
                        className={`segmented-item ${language === 'en' ? 'active accent' : ''}`}
                        onClick={() => setLanguage('en')}
                      >English</button>
                    </div>
                  </div>

                  <div className="field">
                    <label className="form-label">
                      <span className="flex items-center gap-2"><Palette size={15} /> {t('settings.theme')}</span>
                    </label>
                    <div className="segmented full">
                      {themeOptions.map((opt) => (
                        <button
                          key={opt.value}
                          className={`segmented-item ${theme === opt.value ? 'active accent' : ''}`}
                          onClick={() => setTheme(opt.value)}
                        >
                          {opt.icon} {opt.label}
                        </button>
                      ))}
                    </div>
                    <div className="form-hint">{t('setup.preferences.themeHint')}</div>
                  </div>
                </div>
              </>
            )}

            {step.id === 'profile' && (
              <>
                <div className="setup-eyebrow">{t('setup.profile.eyebrow')}</div>
                <h1 className="setup-title">{t('setup.profile.title')}</h1>
                <p className="setup-subtitle">{t('setup.profile.subtitle')}</p>
                <div className="setup-fields">
                  <div className="field">
                    <label className="form-label">{t('settings.profileName')}</label>
                    <input
                      type="text"
                      className="input"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder={t('setup.profile.namePlaceholder')}
                    />
                  </div>
                  <div className="field">
                    <label className="form-label">{t('settings.profileEmail')}</label>
                    <input
                      type="email"
                      className="input"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      placeholder={t('setup.profile.emailPlaceholder')}
                    />
                  </div>
                </div>
              </>
            )}

            {step.id === 'paths' && (
              <>
                <div className="setup-eyebrow">{t('setup.paths.eyebrow')}</div>
                <h1 className="setup-title">{t('setup.paths.title')}</h1>
                <p className="setup-subtitle">{t('setup.paths.subtitle')}</p>
                <div className="setup-fields">
                  <div className="field">
                    <label className="form-label">{t('settings.defaultExportPath')}</label>
                    <div className="input-with-btn">
                      <input
                        type="text"
                        className="input"
                        readOnly
                        value={exportPath || t('settings.notSet')}
                        style={{ color: exportPath ? 'var(--text-primary)' : 'var(--text-muted)' }}
                      />
                      <button className="btn btn-secondary" onClick={() => pickDir(setExportPath)}>
                        {t('settings.select')}
                      </button>
                    </div>
                    <div className="form-hint">{t('settings.defaultExportPathDesc')}</div>
                  </div>
                  <div className="field">
                    <label className="form-label">{t('settings.dataDirectory')}</label>
                    <div className="input-with-btn">
                      <input
                        type="text"
                        className="input"
                        readOnly
                        value={dataDir || t('setup.paths.dataDirDefault')}
                        style={{ color: dataDir ? 'var(--text-primary)' : 'var(--text-muted)' }}
                      />
                      <button className="btn btn-secondary" onClick={() => pickDir(setDataDir)}>
                        {t('settings.select')}
                      </button>
                    </div>
                    <div className="form-hint">{t('settings.dataDirectoryDesc')}</div>
                  </div>
                </div>
              </>
            )}

            {step.id === 'ready' && (
              <>
                <div className="setup-hero-logo"><CheckCircle2 size={44} /></div>
                <div className="setup-eyebrow">{t('setup.ready.eyebrow')}</div>
                <h1 className="setup-title">{t('setup.ready.title')}</h1>
                <p className="setup-subtitle">{t('setup.ready.subtitle')}</p>
                <div className="setup-summary">
                  <div className="setup-summary-row">
                    <span className="setup-summary-key">{t('settings.language')}</span>
                    <span className="setup-summary-val">{language === 'tr' ? 'Türkçe' : 'English'}</span>
                  </div>
                  <div className="setup-summary-row">
                    <span className="setup-summary-key">{t('settings.theme')}</span>
                    <span className="setup-summary-val">
                      {theme === 'dark' ? t('settings.themeDark') : theme === 'light' ? t('settings.themeLight') : t('settings.themeSystem')}
                    </span>
                  </div>
                  <div className="setup-summary-row">
                    <span className="setup-summary-key">{t('settings.profileName')}</span>
                    <span className="setup-summary-val">{profileName || '—'}</span>
                  </div>
                  <div className="setup-summary-row">
                    <span className="setup-summary-key">{t('settings.defaultExportPath')}</span>
                    <span className="setup-summary-val">{exportPath || t('settings.notSet')}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Footer: navigation ── */}
        <div className="setup-footer">
          <div className="flex items-center gap-3">
            {!isFirst && (
              <button className="btn btn-ghost" onClick={prev} disabled={finishing}>
                <ArrowLeft size={15} /> {t('common.back')}
              </button>
            )}
            <div className="setup-dots">
              {STEPS.map((s, i) => (
                <span key={s.id} className={`setup-dot ${i === stepIndex ? 'active' : ''}`} />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isLast && !isFirst && (
              <button className="btn btn-ghost" onClick={next} disabled={finishing}>
                {t('setup.skip')}
              </button>
            )}
            {isLast ? (
              <button className="btn btn-primary btn-lg" onClick={finish} disabled={finishing}>
                <Rocket size={16} /> {t('setup.launch')}
              </button>
            ) : (
              <button className="btn btn-primary btn-lg" onClick={next}>
                {isFirst ? t('setup.getStarted') : t('common.next')} <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
