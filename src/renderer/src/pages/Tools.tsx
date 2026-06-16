import { useState } from 'react'
import { useAppStore } from '../store'
import {
  Palette,
  FileCode,
  Binary,
  Hash,
  Fingerprint,
  RefreshCw,
  Copy,
  Cpu
} from 'lucide-react'

export default function Tools() {
  const { t, addToast } = useAppStore()
  const [activeTool, setActiveTool] = useState<string | null>(null)

  // Sub-tool states
  const [base64Input, setBase64Input] = useState('')
  const [base64Output, setBase64Output] = useState('')
  const [uuidCount, setUuidCount] = useState(1)
  const [generatedUuids, setGeneratedUuids] = useState<string[]>([])
  const [jsonInput, setJsonInput] = useState('{"name":"mavro-studio","active":true}')
  const [jsonOutput, setJsonOutput] = useState('')

  const handleBase64 = (encode: boolean) => {
    try {
      if (encode) {
        setBase64Output(btoa(base64Input))
      } else {
        setBase64Output(atob(base64Input))
      }
      addToast({ message: 'İşlem başarılı', type: 'success' })
    } catch (err) {
      addToast({ message: 'Hatalı veri girdisi', type: 'error' })
    }
  }

  const generateUuids = () => {
    const arr = []
    for (let i = 0; i < uuidCount; i++) {
      arr.push(crypto.randomUUID())
    }
    setGeneratedUuids(arr)
    addToast({ message: `${uuidCount} adet UUID oluşturuldu`, type: 'success' })
  }

  const formatJson = (minify: boolean) => {
    try {
      const parsed = JSON.parse(jsonInput)
      if (minify) {
        setJsonOutput(JSON.stringify(parsed))
      } else {
        setJsonOutput(JSON.stringify(parsed, null, 2))
      }
      addToast({ message: 'JSON formatlandı', type: 'success' })
    } catch (err) {
      addToast({ message: 'Geçersiz JSON formatı', type: 'error' })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    addToast({ message: t('common.copy'), type: 'success' })
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('tools.title')}</h1>
          <p className="page-subtitle">{t('tools.subtitle')}</p>
        </div>
        {activeTool && (
          <button className="btn btn-secondary" onClick={() => setActiveTool(null)}>
            {t('common.back')}
          </button>
        )}
      </div>

      <div className="page-content">
        {!activeTool ? (
          /* Main tool selector grid */
          <div className="card-grid">
            <div className="card stat-card" onClick={() => setActiveTool('json')}>
              <div className="stat-icon blue">
                <FileCode size={22} />
              </div>
              <div className="stat-info">
                <span className="stat-value" style={{ fontSize: 'var(--font-md)' }}>
                  {t('tools.jsonFormatter')}
                </span>
                <span className="stat-label">{t('tools.jsonFormatterDesc')}</span>
              </div>
            </div>

            <div className="card stat-card" onClick={() => setActiveTool('base64')}>
              <div className="stat-icon green">
                <Binary size={22} />
              </div>
              <div className="stat-info">
                <span className="stat-value" style={{ fontSize: 'var(--font-md)' }}>
                  {t('tools.base64')}
                </span>
                <span className="stat-label">{t('tools.base64Desc')}</span>
              </div>
            </div>

            <div className="card stat-card" onClick={() => setActiveTool('uuid')}>
              <div className="stat-icon purple">
                <Fingerprint size={22} />
              </div>
              <div className="stat-info">
                <span className="stat-value" style={{ fontSize: 'var(--font-md)' }}>
                  {t('tools.uuidGenerator')}
                </span>
                <span className="stat-label">{t('tools.uuidGeneratorDesc')}</span>
              </div>
            </div>
          </div>
        ) : (
          /* Individual sub-tool frames */
          <div className="card flex flex-col gap-4">
            {activeTool === 'json' && (
              <div>
                <h3 className="card-title mb-4">{t('tools.jsonFormatter')}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div>
                    <label className="form-label">{t('apiTester.body')}</label>
                    <textarea
                      className="input input-mono"
                      style={{ height: '240px', resize: 'vertical' }}
                      value={jsonInput}
                      onChange={(e) => setJsonInput(e.target.value)}
                    />
                    <div className="flex gap-2 mt-4">
                      <button className="btn btn-primary" onClick={() => formatJson(false)}>
                        Format
                      </button>
                      <button className="btn btn-secondary" onClick={() => formatJson(true)}>
                        Minify
                      </button>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="form-label">{t('apiTester.response')}</label>
                      {jsonOutput && (
                        <button className="btn btn-ghost btn-sm" onClick={() => copyToClipboard(jsonOutput)}>
                          <Copy size={14} />
                        </button>
                      )}
                    </div>
                    <pre className="code-block" style={{ height: '240px', overflowY: 'auto' }}>
                      {jsonOutput || '// Output will appear here'}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {activeTool === 'base64' && (
              <div>
                <h3 className="card-title mb-4">{t('tools.base64')}</h3>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="form-label">Input string</label>
                    <textarea
                      className="input"
                      style={{ height: '100px', resize: 'none' }}
                      value={base64Input}
                      onChange={(e) => setBase64Input(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button className="btn btn-primary" onClick={() => handleBase64(true)}>
                      Encode
                    </button>
                    <button className="btn btn-secondary" onClick={() => handleBase64(false)}>
                      Decode
                    </button>
                  </div>
                  {base64Output && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="form-label">Output result</label>
                        <button className="btn btn-ghost btn-sm" onClick={() => copyToClipboard(base64Output)}>
                          <Copy size={14} />
                        </button>
                      </div>
                      <div className="code-block">{base64Output}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTool === 'uuid' && (
              <div>
                <h3 className="card-title mb-4">{t('tools.uuidGenerator')}</h3>
                <div className="flex flex-col gap-4">
                  <div className="flex gap-3 items-center">
                    <span className="text-sm">Count:</span>
                    <input
                      type="number"
                      className="input"
                      style={{ width: '80px' }}
                      value={uuidCount}
                      min="1"
                      max="10"
                      onChange={(e) => setUuidCount(parseInt(e.target.value) || 1)}
                    />
                    <button className="btn btn-primary" onClick={generateUuids}>
                      <RefreshCw size={14} />
                      Generate
                    </button>
                  </div>
                  {generatedUuids.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <label className="form-label">UUID Results</label>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => copyToClipboard(generatedUuids.join('\n'))}
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                      <div className="flex flex-col gap-1">
                        {generatedUuids.map((id, index) => (
                          <div key={index} className="code-block font-mono flex justify-between items-center">
                            <span>{id}</span>
                            <button
                              className="btn btn-ghost btn-sm btn-icon"
                              style={{ width: 22, height: 22 }}
                              onClick={() => copyToClipboard(id)}
                            >
                              <Copy size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
