import jsPDF from 'jspdf'

export function generateCertificate(
  associateName: string,
  division: string,
  completionDate: Date
): Blob {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  })

  const width = doc.internal.pageSize.getWidth()
  const height = doc.internal.pageSize.getHeight()

  // Background color
  doc.setFillColor(26, 84, 144)
  doc.rect(0, 0, width, height, 'F')

  // White border
  doc.setDrawColor(255, 255, 255)
  doc.setLineWidth(5)
  doc.rect(10, 10, width - 20, height - 20)

  // Title
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(48)
  doc.setTextColor(243, 146, 0)
  doc.text('Certificate of Completion', width / 2, 50, { align: 'center' })

  // Divider line
  doc.setDrawColor(243, 146, 0)
  doc.setLineWidth(2)
  doc.line(40, 65, width - 40, 65)

  // Main text
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(14)
  doc.setTextColor(255, 255, 255)
  doc.text(
    'This certifies that',
    width / 2,
    90,
    { align: 'center' }
  )

  // Associate name
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  doc.setTextColor(243, 146, 0)
  doc.text(associateName, width / 2, 110, { align: 'center' })

  // Completion text
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(14)
  doc.setTextColor(255, 255, 255)
  doc.text(
    'has successfully completed the',
    width / 2,
    130,
    { align: 'center' }
  )

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(
    'Adams Homes Sales Associate Onboarding Program',
    width / 2,
    145,
    { align: 'center' }
  )

  // Division
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  doc.setTextColor(200, 200, 200)
  doc.text(`Division: ${division}`, width / 2, 160, { align: 'center' })

  // Date
  const dateStr = completionDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  doc.text(`Date of Completion: ${dateStr}`, width / 2, 170, { align: 'center' })

  // Signature line
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(10)
  doc.text('_________________________', 50, 190)
  doc.text('_________________________', width - 80, 190)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text('Bryan Adams, President', 50, 200)
  doc.text('Date', width - 80, 200)

  // Adams Homes watermark
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(32)
  doc.setTextColor(26, 84, 144)
  doc.setOpacity(0.1)
  doc.text('ADAMS HOMES', width / 2, height / 2, {
    align: 'center',
    angle: -45,
  })

  return doc.output('blob')
}

export function downloadCertificate(
  blob: Blob,
  associateName: string,
  division: string
) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `Adams_Homes_Certificate_${associateName.replace(/\s+/g, '_')}_${division.replace(/\s+/g, '_')}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
