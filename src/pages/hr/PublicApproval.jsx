import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/axios'

export default function PublicApproval() {

  const { token } = useParams()

  const [leave, setLeave] = useState(null)
  const [loading, setLoading] = useState(true)

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


  if (loading) {
    return <div style={{padding:40}}>Loading...</div>
  }


  if (!leave) {
    return (
      <div style={{padding:40}}>
        Pengajuan tidak ditemukan.
      </div>
    )
  }


  return (
    <div style={{
      minHeight:'100vh',
      background:'#f4f9ff',
      padding:'50px'
    }}>

      <div style={{
        background:'#fff',
        maxWidth:700,
        margin:'auto',
        borderRadius:20,
        padding:40,
        boxShadow:'0 10px 30px rgba(0,0,0,.08)'
      }}>

        <h2>
          Detail Pengajuan Cuti
        </h2>


        <hr/>


        <h3>
          {leave.employee}
        </h3>


        <p>
          Departemen:
          <b> {leave.department}</b>
        </p>


        <p>
          Jenis Cuti:
          <b> {leave.type}</b>
        </p>


        <p>
          Periode:
          <b>
            {' '}
            {leave.from} - {leave.to}
          </b>
        </p>


        <p>
          Durasi:
          <b> {leave.days} hari</b>
        </p>


        <p>
          Alasan:
        </p>

        <div>
          {leave.reason}
        </div>


        <br/>


        <div style={{
          display:'flex',
          gap:15
        }}>

          <button
            style={{
              background:'#ef4444',
              color:'#fff',
              padding:'12px 25px',
              border:0,
              borderRadius:10
            }}
          >
            Tolak
          </button>


          <button
            style={{
              background:'#10b981',
              color:'#fff',
              padding:'12px 25px',
              border:0,
              borderRadius:10
            }}
          >
            Setujui
          </button>

        </div>


      </div>

    </div>
  )
}