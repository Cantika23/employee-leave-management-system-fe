import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  HeartPulse,
  Plane,
  ScrollText,
  Sparkles,
  Clock,
  Check,
  X,
  Paperclip
} from 'lucide-react'
import api from '../api/axios'

const TYPE_STYLE = {
  annual: {
    icon: Plane,
    color: '#0EA5E9',
    soft: '#e6f5fd'
  },

  sick: {
    icon: HeartPulse,
    color: '#f43f5e',
    soft: '#fdecef'
  },

  izin: {
    icon: ScrollText,
    color: '#f59e0b',
    soft: '#fef3e2'
  },
}

const DEFAULT_STYLE = {
  icon: Sparkles,
  color: '#8b5cf6',
  soft: '#f2edfd'
}

function resolveTypeStyle(label = '') {
  const value = label.toLowerCase()
  if (value.includes('sakit'))
    return TYPE_STYLE.sick
  if (value.includes('izin'))
    return TYPE_STYLE.izin
  if (
    value.includes('tahunan') ||
    value.includes('annual')
  )
    return TYPE_STYLE.annual
  return DEFAULT_STYLE
}

// A single label/value row inside the formal detail table.
function DocRow({ label, children, last }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 20,
        padding: '13px 0',
        borderBottom: last ? 'none' : '1px solid #eef0f3',
      }}
    >
      <span
        style={{
          flex: '0 0 140px',
          fontSize: 12.5,
          color: '#94a3b8',
        }}
      >
        {label}
      </span>
      <span
        style={{
          flex: 1,
          fontSize: 14.5,
          color: '#1e293b',
          fontWeight: 600,
        }}
      >
        {children}
      </span>
    </div>
  )
}

export default function PublicApproval() {
  const { token } = useParams()
  const [leave, setLeave] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [rejectModal, setRejectModal] = useState(false)
  const [rejectNote, setRejectNote] = useState('')

  useEffect(() => {
    api
      .get(`/public/approval/${token}`)
      .then((res) => {
        setLeave(res.data)
      })
      .catch((err) => {
        console.log(err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [token])

  async function decide(status, note = '') {
    setProcessing(true)
    try {
      await api.patch(
        `/public/approval/${token}/decide`,
        {
          decision: status,
          decision_note: note
        }
      )
      setLeave(prev => ({
        ...prev,
        status
      }))
    } catch (err) {
      console.log(err)
      alert(
        'Gagal memperbarui pengajuan'
      )
    }
    setProcessing(false)
  }

  if (loading) {
    return (
      <div
        style={{
          padding:40,
          textAlign:'center'
        }}
      >
        Loading...
      </div>
    )

  }

  if (!leave) {
    return (
      <div
        style={{
          padding:40,
          textAlign:'center'
        }}
      >
        Pengajuan tidak ditemukan
      </div>
    )
  }

  const style = resolveTypeStyle(
    leave.type
  )

  const Icon = style.icon
  return (
    <div
      style={{
        minHeight:'100vh',
        background:'#f8fafc',
        padding:'50px 20px'
      }}
    >
      <div
        style={{
          maxWidth:620,
          margin:'auto',
          background:'#fff',
          borderRadius:20,
          overflow:'hidden',
          boxShadow:
          '0 24px 60px -18px rgba(15,23,42,.25)'
        }}
      >
        {/* STRIP */}
        <div
          style={{
            height:6,
            background:
            `linear-gradient(90deg, ${style.color}, ${style.color}80)`
          }}
        />

        <div
          style={{
            padding:24
          }}
        >

          {/* HEADER */}
          <div
            style={{
              display:'flex',
              justifyContent:'space-between',
              alignItems:'flex-start',
              marginBottom:22
            }}
          >
            <div>
              <div
                style={{
                  color:'#64748b',
                  fontSize:12.5,
                  fontWeight:600
                }}
              >
                Detail Pengajuan
              </div>

              <div
                style={{
                  display:'flex',
                  alignItems:'center',
                  gap:12,
                  marginTop:12
                }}
              >
                <div
                  style={{
                    width:45,
                    height:45,
                    borderRadius:14,
                    background:style.soft,
                    color:style.color,
                    display:'grid',
                    placeItems:'center',
                    fontWeight:700
                  }}
                >
                  {leave.employee
                    ?.substring(0,1)
                    .toUpperCase()
                  }
                </div>

                <div>
                  <strong>
                    {leave.employee}
                  </strong>
                  <div
                    style={{
                      color:'#64748b',
                      fontSize:14
                    }}
                  >
                    {leave.department}
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                padding:'8px 16px',
                borderRadius:20,
                fontWeight:600,
                fontSize:13,
                background:
                leave.status === 'approved'
                ? '#dcfce7'
                :
                leave.status === 'rejected'
                ? '#fee2e2'
                :
                '#fef3c7',
                color:
                leave.status === 'approved'
                ? '#166534'
                :
                leave.status === 'rejected'
                ? '#991b1b'
                :
                '#92400e'
              }}
            >
              {
                leave.status === 'approved'
                ? 'Disetujui'
                :
                leave.status === 'rejected'
                ? 'Ditolak'
                :
                'Menunggu'
              }
            </div>
          </div>

          {/* Formal detail table — Jenis / Periode / Durasi as plain label-value rows */}
          <div
            style={{
              border: '1px solid #eef0f3',
              borderRadius: 14,
              padding: '2px 18px',
            }}
          >
            <DocRow label="Jenis cuti">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                <Icon size={14} style={{ color: style.color, flexShrink: 0 }} />
                {leave.type}
              </span>
            </DocRow>

            <DocRow label="Periode">
              {leave.from} &ndash; {leave.to}
            </DocRow>

            <DocRow label="Durasi" last>
              {leave.days} hari kerja
            </DocRow>
          </div>
          {/* ALASAN */}
          <div
            style={{
              marginTop:20,
              padding:18,
              borderLeft:
              `3px solid ${style.color}`,
              background:'#fbfbfc',
              borderRadius: '0 12px 12px 0',
            }}
          >
            <div
              style={{
                color:'#64748b',
                fontSize:13,
                marginBottom:8
              }}
            >
              Alasan Pengajuan
            </div>

            <p
              style={{
                margin:0,
                lineHeight:1.6
              }}
            >
              {leave.reason}
            </p>
          </div>

          {/* LAMPIRAN */}
          {
            leave.attachment && (
              <div
                style={{
                  marginTop:20,
                  padding:15,
                  border:'1px dashed #dfe3e8',
                  borderRadius:14,
                  display:'flex',
                  justifyContent:'space-between',
                  alignItems:'center'
                }}
              >
                <div
                  style={{
                    display:'flex',
                    alignItems:'center',
                    gap:10
                  }}
                >
                  <Paperclip size={16}/>
                  <strong>
                    {
                      leave.attachmentName ||
                      'Lampiran'
                    }
                  </strong>
                </div>
                <a
                  href={leave.attachment}
                  target="_blank"
                  rel="noreferrer"
                >
                  Lihat
                </a>
              </div>
            )
          }

          {/* BUTTON */}
          {
            leave.status === 'pending' && (
              <div
                style={{
                  marginTop:25,
                  paddingTop:20,
                  borderTop:'1px solid #eef0f3',
                  display:'flex',
                  justifyContent:'flex-end',
                  gap:10
                }}
              >
                <button
                  disabled={processing}
                  onClick={() => {
                    setRejectModal(true)
                  }}

                  style={{
                    background:'#ef4444',
                    color:'#fff',
                    border:0,
                    borderRadius:10,
                    padding:'12px 25px',
                    display:'flex',
                    alignItems:'center',
                    gap:6,
                    cursor:'pointer'
                  }}

                >

                  <X size={15}/>
                  Tolak
                </button>

                <button
                  disabled={processing}
                  onClick={() =>
                    decide('approved')
                  }
                  style={{
                    background:'#16a34a',
                    color:'#fff',
                    border:0,
                    borderRadius:10,
                    padding:'12px 25px',
                    display:'flex',
                    alignItems:'center',
                    gap:6,
                    cursor:'pointer'
                  }}
                >
                  <Check size={15}/>
                  Setujui
                </button>
              </div>
            )
          }

          {
            rejectModal && (
              <div
                style={{
                  position:'fixed',
                  inset:0,
                  background:'rgba(0,0,0,.4)',
                  display:'flex',
                  justifyContent:'center',
                  alignItems:'center',
                  zIndex:999
                }}
              >
                <div
                  style={{
                    background:'#fff',
                    width:400,
                    borderRadius:16,
                    padding:25
                  }}
                >

                  <h3>Tolak Pengajuan</h3>

                  <textarea
                    value={rejectNote}
                    onChange={(e)=>setRejectNote(e.target.value)}
                    placeholder="Alasan penolakan..."
                    style={{
                      width:'100%',
                      height:100,
                      marginTop:15,
                      padding:10
                    }}
                  />

                  <div
                    style={{
                      display:'flex',
                      justifyContent:'flex-end',
                      gap:10,
                      marginTop:20
                    }}
                  >

                    <button
                      onClick={()=>{
                        setRejectModal(false)
                        setRejectNote('')
                      }}
                      style={{
                        background:'#ef4444',
                        color:'#fff',
                        border:0,
                        borderRadius:10,
                        padding:'10px 20px',
                        display:'flex',
                        alignItems:'center',
                        gap:6,
                        cursor:'pointer',
                        fontSize:16
                      }}
                    >
                      Batal
                    </button>


                    <button
                      disabled={processing}
                      onClick={()=>{
                        decide('rejected', rejectNote)
                        setRejectModal(false)
                      }}
                      style={{
                        background:'#ef4444',
                        color:'#fff',
                        border:0,
                        padding:'10px 20px',
                        borderRadius:8
                      }}
                    >
                      Tolak
                    </button>

                  </div>

                </div>
              </div>
            )
          }
        </div>
      </div>
    </div>
  )
}