import FileSaver from "file-saver"
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun, BorderStyle } from "docx"
import { jsPDF } from "jspdf"
import "jspdf-autotable"
import html2canvas from "html2canvas"

// Tipo para os dados do relatório
interface ReportData {
  title: string
  address: string
  occupant: string
  inspector: string
  usage: string
  age: string
  buildingType: string
  conservationState: string
  constructionStandard: string
  observations: string
  date: string
  technicalInfo: string
  engineer: string
  registration: string
  locationImage?: string
  logoImage?: string
  [key: string]: string | undefined
}

// Tipo para as fotos
interface Photo {
  id: string
  url: string
  caption: string
}

// Corrigir a função urlToArrayBuffer para lidar melhor com imagens base64
async function urlToArrayBuffer(url: string): Promise<ArrayBuffer> {
  try {
    // Verificar se é uma URL base64
    if (url.startsWith("data:")) {
      // Extrair os dados base64
      const base64 = url.split(",")[1]
      if (!base64) {
        throw new Error("URL base64 inválida")
      }

      // Converter base64 para ArrayBuffer
      const binaryString = window.atob(base64)
      const len = binaryString.length
      const bytes = new Uint8Array(len)

      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      return bytes.buffer
    } else {
      // Para URLs normais, usar fetch
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Falha ao buscar imagem: ${response.status} ${response.statusText}`)
      }
      const blob = await response.blob()
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as ArrayBuffer)
        reader.onerror = reject
        reader.readAsArrayBuffer(blob)
      })
    }
  } catch (error) {
    console.error("Erro ao converter URL para ArrayBuffer:", error)
    throw error
  }
}

// Função melhorada para processar imagens base64
async function processBase64Image(base64String: string, maxWidth: number, maxHeight: number): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      if (!base64String || base64String.length < 100) {
        console.warn("Imagem base64 inválida ou vazia")
        resolve("")
        return
      }

      const img = new Image()
      img.crossOrigin = "anonymous"

      img.onload = () => {
        const canvas = document.createElement("canvas")

        // Calcular dimensões mantendo a proporção
        let width = img.width
        let height = img.height

        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext("2d")
        if (ctx) {
          // Limpar o canvas
          ctx.fillStyle = "#ffffff"
          ctx.fillRect(0, 0, width, height)

          // Desenhar a imagem
          ctx.drawImage(img, 0, 0, width, height)

          // Converter para formato otimizado
          const processedImageUrl = canvas.toDataURL("image/jpeg", 0.9)
          resolve(processedImageUrl)
        } else {
          reject(new Error("Não foi possível obter contexto do canvas"))
        }
      }

      img.onerror = (e) => {
        console.error("Erro ao carregar imagem:", e)
        reject(new Error("Erro ao carregar imagem"))
      }

      img.src = base64String
    } catch (error) {
      console.error("Erro ao processar imagem base64:", error)
      reject(error)
    }
  })
}

// Função melhorada para adicionar a capa do PDF
async function addCoverPage(doc: jsPDF, reportData: ReportData) {
  try {
    // Adicionar o logo
    if (reportData.logoImage && reportData.logoImage.length > 100) {
      try {
        // Processar o logo para garantir que seja exibido corretamente
        const processedLogo = await processBase64Image(reportData.logoImage, 200, 80)

        if (processedLogo) {
          // Adicionar o logo ao PDF
          doc.addImage(processedLogo, "JPEG", 20, 20, 40, 20)
          console.log("Logo adicionado com sucesso")
        }
      } catch (error) {
        console.error("Erro ao adicionar logo:", error)
      }
    } else {
      console.warn("Logo não disponível ou inválido")
    }

    // Título
    doc.setFont("times", "bold")
    doc.setFontSize(14)
    doc.setTextColor(0, 0, 0)
    doc.text(reportData.title || "VISTORIA 3: RUA BENEDITO DOS SANTOS, 44 – PARQUE SÃO JORGE – SP", 105, 70, {
      align: "center",
      maxWidth: 170,
    })

    // Imagem de localização
    if (reportData.locationImage && reportData.locationImage.length > 100) {
      try {
        // Processar a imagem para garantir que seja exibida corretamente
        const processedImage = await processBase64Image(reportData.locationImage, 800, 600)

        if (processedImage) {
          // Adicionar a imagem ao PDF
          doc.addImage(processedImage, "JPEG", 30, 100, 150, 100)
          console.log("Imagem de localização adicionada com sucesso")
        }
      } catch (error) {
        console.error("Erro ao adicionar imagem de localização:", error)
        // Adicionar um placeholder se a imagem falhar
        doc.setFillColor(240, 240, 240)
        doc.rect(30, 100, 150, 100, "F")
        doc.setFontSize(12)
        doc.text("Imagem de Localização", 105, 150, { align: "center" })
      }
    } else {
      console.warn("Imagem de localização não disponível ou inválida")
      // Usar placeholder se não houver imagem
      doc.setFillColor(240, 240, 240)
      doc.rect(30, 100, 150, 100, "F")
      doc.setFontSize(12)
      doc.text("Imagem de Localização", 105, 150, { align: "center" })
    }

    // Legenda da imagem
    doc.setFontSize(11)
    doc.setFont("times", "normal")
    doc.text("Localização esquemática do imóvel", 105, 210, { align: "center" })

    // Rodapé com número da página
    doc.setFontSize(10)
    doc.setFont("times", "normal")
    doc.line(20, 280, 190, 280)
    doc.text("Rua Fernão Albernaz 332 - apto 14 - Vila Nova Savoia – Contato: 11 97413-4386", 20, 287)
    doc.text("1", 190, 287, { align: "right" })
  } catch (error) {
    console.error("Erro ao adicionar capa:", error)
  }
}

// Função auxiliar para adicionar o logo em qualquer página
async function addLogoToPage(doc: jsPDF, reportData: ReportData) {
  try {
    if (reportData.logoImage && reportData.logoImage.length > 100) {
      // Processar o logo para garantir que seja exibido corretamente
      const processedLogo = await processBase64Image(reportData.logoImage, 200, 80)

      if (processedLogo) {
        // Adicionar o logo ao PDF
        doc.addImage(processedLogo, "JPEG", 20, 20, 40, 20)
      }
    }
  } catch (error) {
    console.error("Erro ao adicionar logo à página:", error)
  }
}

// Função auxiliar para adicionar a página de dados ao PDF
async function addDataPage(doc: jsPDF, reportData: ReportData) {
  // Título da seção
  doc.setFontSize(14)
  doc.setFont("times", "bold")
  doc.text("Ficha com dados da construção e seus ocupantes:", 20, 30)

  // Adicionar o logo no canto superior direito (em vez de esquerdo)
  try {
    if (reportData.logoImage && reportData.logoImage.length > 100) {
      // Processar o logo para garantir que seja exibido corretamente
      const processedLogo = await processBase64Image(reportData.logoImage, 200, 80)

      if (processedLogo) {
        // Adicionar o logo ao PDF no canto superior direito
        doc.addImage(processedLogo, "JPEG", 150, 20, 40, 20)
      }
    }
  } catch (error) {
    console.error("Erro ao adicionar logo à página:", error)
  }

  // Dados da construção
  doc.setFontSize(12)
  doc.setFont("times", "bold")
  doc.text("Ocupante / telefone:", 20, 50)
  doc.setFont("times", "normal")
  doc.text(reportData.occupant, 70, 50)

  doc.setFont("times", "bold")
  doc.text("Vistoriador:", 20, 60)
  doc.setFont("times", "normal")
  doc.text(reportData.inspector, 70, 60)

  doc.setFont("times", "bold")
  doc.text("Uso do Imóvel:", 20, 70)
  doc.setFont("times", "normal")
  doc.text(reportData.usage, 70, 70)

  doc.setFont("times", "bold")
  doc.text("Idade real ou estimada / aparente:", 20, 80)
  doc.setFont("times", "normal")
  doc.text(reportData.age, 100, 80)

  doc.setFont("times", "bold")
  doc.text("Tipo de edificação:", 20, 90)
  doc.setFont("times", "normal")
  doc.text(reportData.buildingType, 70, 90)

  doc.setFont("times", "bold")
  doc.text("Estado de conservação:", 20, 100)
  doc.setFont("times", "normal")
  doc.text(reportData.conservationState, 70, 100)

  doc.setFont("times", "bold")
  doc.text("Padrão construtivo:", 20, 110)
  doc.setFont("times", "normal")
  doc.text(reportData.constructionStandard, 70, 110)

  doc.setFont("times", "bold")
  doc.text("Observações gerais:", 20, 130)
  doc.setFont("times", "normal")
  doc.text(reportData.observations, 20, 140, { maxWidth: 170 })

  doc.setFont("times", "bold")
  doc.text("Data da Diligência:", 20, 160)
  doc.setFont("times", "normal")
  doc.text(reportData.date, 70, 160)

  // Rodapé com número da página
  doc.setFontSize(10)
  doc.setFont("times", "normal")
  doc.line(20, 280, 190, 280)
  doc.text("Rua Fernão Albernaz 332 - apto 14 - Vila Nova Savoia – Contato: 11 97413-4386", 20, 287)
  doc.text("2", 190, 287, { align: "right" })
}

// Função auxiliar para adicionar a página de informações técnicas ao PDF
async function addTechnicalInfoPage(doc: jsPDF, reportData: ReportData) {
  // Título da seção
  doc.setFontSize(14)
  doc.setFont("times", "bold")
  doc.text("Informações técnicas", 20, 30)

  // Adicionar o logo no canto superior direito (em vez de esquerdo)
  try {
    if (reportData.logoImage && reportData.logoImage.length > 100) {
      // Processar o logo para garantir que seja exibido corretamente
      const processedLogo = await processBase64Image(reportData.logoImage, 200, 80)

      if (processedLogo) {
        // Adicionar o logo ao PDF no canto superior direito
        doc.addImage(processedLogo, "JPEG", 150, 20, 40, 20)
      }
    }
  } catch (error) {
    console.error("Erro ao adicionar logo à página:", error)
  }

  // Informações técnicas
  doc.setFontSize(12)
  doc.setFont("times", "normal")

  // Dividir o texto em linhas para melhor formatação
  const textLines = doc.splitTextToSize(reportData.technicalInfo, 170)
  doc.text(textLines, 20, 50)

  // Assinatura
  doc.setFontSize(12)
  doc.text(reportData.engineer, 105, 240, { align: "center" })
  doc.text(reportData.registration, 105, 250, { align: "center" })

  // Rodapé com número da página
  doc.setFontSize(10)
  doc.setFont("times", "normal")
  doc.line(20, 280, 190, 280)
  doc.text("Rua Fernão Albernaz 332 - apto 14 - Vila Nova Savoia – Contato: 11 97413-4386", 20, 287)
  doc.text("3", 190, 287, { align: "right" })
}

// Função auxiliar para adicionar a página de fotos ao PDF
async function addPhotoPage(doc: jsPDF, photos: Photo[], pageNumber: number, reportData: any) {
  // Adicionar o logo no canto superior direito (em vez de esquerdo)
  try {
    if (reportData.logoImage && reportData.logoImage.length > 100) {
      // Processar o logo para garantir que seja exibido corretamente
      const processedLogo = await processBase64Image(reportData.logoImage, 200, 80)

      if (processedLogo) {
        // Adicionar o logo ao PDF no canto superior direito
        doc.addImage(processedLogo, "JPEG", 150, 20, 40, 20)
      }
    }
  } catch (error) {
    console.error("Erro ao adicionar logo à página:", error)
  }

  // Primeira foto (se existir)
  if (photos.length > 0) {
    try {
      // Adicionar a legenda ANTES
      // da foto (sem retângulo)
      doc.setFontSize(11)
      doc.setFont("times", "normal")
      // Remover o retângulo para a legenda
      doc.text(photos[0].caption || "Sem legenda", 105, 46, { align: "center", maxWidth: 150 })

      // Criar um canvas para a foto
      const canvas = document.createElement("canvas")
      canvas.width = 600
      canvas.height = 400
      const ctx = canvas.getContext("2d")

      if (ctx) {
        // Desenhar um retângulo cinza como fallback
        ctx.fillStyle = "#f0f0f0"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Tentar carregar a imagem real
        const img = new Image()
        img.crossOrigin = "anonymous"

        const imageLoaded = await new Promise<boolean>((resolve) => {
          img.onload = () => {
            // Calcular dimensões para manter a proporção
            const scale = Math.min(canvas.width / img.width, canvas.height / img.height)
            const x = (canvas.width - img.width * scale) / 2
            const y = (canvas.height - img.height * scale) / 2

            ctx.drawImage(img, x, y, img.width * scale, img.height * scale)
            resolve(true)
          }

          img.onerror = () => {
            ctx.fillStyle = "#666666"
            ctx.font = "20px Times New Roman"
            ctx.textAlign = "center"
            ctx.fillText("Imagem não disponível", canvas.width / 2, canvas.height / 2)
            resolve(false)
          }

          img.src = photos[0].url

          if (img.complete) {
            resolve(img.naturalWidth !== 0)
          }
        })

        // Adicionar a imagem do canvas ao PDF - altura reduzida para não ultrapassar o rodapé
        const imgData = canvas.toDataURL("image/png")
        doc.addImage(imgData, "PNG", 30, 55, 150, 90)
      } else {
        // Fallback se o contexto do canvas não estiver disponível
        doc.setFillColor(240, 240, 240)
        doc.rect(30, 55, 150, 90, "F")
        doc.setFontSize(12)
        doc.text("Imagem não disponível", 105, 105, { align: "center" })
      }
    } catch (error) {
      console.warn("Erro ao adicionar imagem ao PDF:", error)

      // Adicionar um placeholder se a imagem falhar
      doc.setFillColor(240, 240, 240)
      doc.rect(30, 55, 150, 90, "F")
      doc.setFontSize(12)
      doc.text("Imagem não disponível", 105, 105, { align: "center" })
    }
  }

  // Segunda foto (se existir)
  if (photos.length > 1) {
    try {
      // Adicionar a legenda ANTES da foto (sem retângulo)
      doc.setFontSize(11)
      doc.setFont("times", "normal")
      // Remover o retângulo para a legenda
      doc.text(photos[1].caption || "Sem legenda", 105, 176, { align: "center", maxWidth: 150 })

      // Criar um canvas para a foto
      const canvas = document.createElement("canvas")
      canvas.width = 600
      canvas.height = 400
      const ctx = canvas.getContext("2d")

      if (ctx) {
        // Desenhar um retângulo cinza como fallback
        ctx.fillStyle = "#f0f0f0"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Tentar carregar a imagem real
        const img = new Image()
        img.crossOrigin = "anonymous"

        const imageLoaded = await new Promise<boolean>((resolve) => {
          img.onload = () => {
            // Calcular dimensões para manter a proporção
            const scale = Math.min(canvas.width / img.width, canvas.height / img.height)
            const x = (canvas.width - img.width * scale) / 2
            const y = (canvas.height - img.height * scale) / 2

            ctx.drawImage(img, x, y, img.width * scale, img.height * scale)
            resolve(true)
          }

          img.onerror = () => {
            ctx.fillStyle = "#666666"
            ctx.font = "20px Times New Roman"
            ctx.textAlign = "center"
            ctx.fillText("Imagem não disponível", canvas.width / 2, canvas.height / 2)
            resolve(false)
          }

          img.src = photos[1].url

          if (img.complete) {
            resolve(img.naturalWidth !== 0)
          }
        })

        // Adicionar a imagem do canvas ao PDF - altura reduzida para não ultrapassar o rodapé
        const imgData = canvas.toDataURL("image/png")
        doc.addImage(imgData, "PNG", 30, 185, 150, 90)
      } else {
        // Fallback se o contexto do canvas não estiver disponível
        doc.setFillColor(240, 240, 240)
        doc.rect(30, 185, 150, 90, "F")
        doc.setFontSize(12)
        doc.text("Imagem não disponível", 105, 235, { align: "center" })
      }
    } catch (error) {
      console.warn("Erro ao adicionar imagem ao PDF:", error)

      // Adicionar um placeholder se a imagem falhar
      doc.setFillColor(240, 240, 240)
      doc.rect(30, 185, 150, 90, "F")
      doc.setFontSize(12)
      doc.text("Imagem não disponível", 105, 235, { align: "center" })
    }
  }

  // Rodapé com número da página
  doc.setFontSize(10)
  doc.setFont("times", "normal")
  doc.line(20, 280, 190, 280)
  doc.text("Rua Fernão Albernaz 332 - apto 14 - Vila Nova Savoia – Contato: 11 97413-4386", 20, 287)
  doc.text(pageNumber.toString(), 190, 287, { align: "right" })
}

// Função para exportar para HTML e depois para PDF (alternativa que pode ter melhor fidelidade visual)
export async function exportToPDFFromHTML(
  containerId: string,
  reportData: ReportData,
  onProgress?: (progress: number) => void,
) {
  try {
    if (onProgress) onProgress(10)

    // Obter o elemento que contém o relatório
    const element = document.getElementById(containerId)
    if (!element) {
      throw new Error(`Elemento com ID ${containerId} não encontrado`)
    }

    // Criar um clone do elemento para não afetar a visualização
    const clone = element.cloneNode(true) as HTMLElement
    clone.style.width = "210mm"
    clone.style.height = "auto"
    clone.style.position = "absolute"
    clone.style.left = "-9999px"
    document.body.appendChild(clone)

    if (onProgress) onProgress(20)

    // Converter o elemento para canvas
    const canvas = await html2canvas(clone, {
      scale: 2, // Melhor qualidade
      useCORS: true, // Permitir imagens de outros domínios
      logging: false,
    })

    if (onProgress) onProgress(70)

    // Criar um PDF do tamanho do canvas
    const imgData = canvas.toDataURL("image/png")
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

    // Adicionar a imagem ao PDF
    const imgWidth = 210
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight)

    // Remover o clone
    document.body.removeChild(clone)

    if (onProgress) onProgress(90)

    // Salvar o PDF
    pdf.save(`VISTORIA 3 - RUA BENEDITO DOS SANTOS.pdf`)

    if (onProgress) onProgress(100)

    return true
  } catch (error) {
    console.error("Erro ao exportar para PDF a partir do HTML:", error)
    throw error
  }
}

// Função para exportar para PDF - usando jsPDF e autotable
export async function exportToPDF(reportData: ReportData, photos: Photo[], onProgress?: (progress: number) => void) {
  try {
    if (onProgress) onProgress(5)

    console.log("Iniciando exportação para PDF")
    console.log("Imagem de localização:", reportData.locationImage ? "Presente" : "Ausente")
    console.log("Logo personalizado:", reportData.logoImage ? "Presente" : "Ausente")

    // Criar um novo documento jsPDF
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

    // Definir as fontes padrão
    doc.setFont("Times", "normal")

    // Adicionar a página de capa
    await addCoverPage(doc, reportData)

    if (onProgress) onProgress(20)

    // Adicionar a página de dados
    doc.addPage()
    await addDataPage(doc, reportData)

    if (onProgress) onProgress(40)

    // Adicionar a página de informações técnicas
    doc.addPage()
    await addTechnicalInfoPage(doc, reportData)

    if (onProgress) onProgress(60)

    // Adicionar as páginas de fotos
    let photoPageNumber = 4 // Iniciar a contagem das páginas de fotos
    for (let i = 0; i < photos.length; i += 2) {
      doc.addPage()
      const photoPair = photos.slice(i, i + 2)
      await addPhotoPage(doc, photoPair, photoPageNumber, reportData)
      photoPageNumber++

      if (onProgress) onProgress(60 + Math.floor(((i + 2) / photos.length) * 30))
    }

    if (onProgress) onProgress(95)

    // Salvar o PDF
    doc.save(`VISTORIA 3 - RUA BENEDITO DOS SANTOS.pdf`)

    if (onProgress) onProgress(100)

    return true
  } catch (error) {
    console.error("Erro ao exportar para PDF:", error)
    throw error
  }
}

// Função para exportar para Word
export async function exportToWord(reportData: ReportData, photos: Photo[], onProgress?: (progress: number) => void) {
  try {
    if (onProgress) onProgress(10)

    console.log("Iniciando exportação para Word")
    console.log("Imagem de localização:", reportData.locationImage ? "Presente" : "Ausente")
    console.log("Logo personalizado:", reportData.logoImage ? "Presente" : "Ausente")

    // Carregar o logo
    let logoBuffer: ArrayBuffer
    try {
      if (reportData.logoImage && reportData.logoImage.length > 100) {
        // Processar o logo para garantir que seja exibido corretamente
        const processedLogo = await processBase64Image(reportData.logoImage, 200, 80)
        logoBuffer = await urlToArrayBuffer(processedLogo)
      } else {
        // Usar o logo padrão
        logoBuffer = await urlToArrayBuffer("/images/logo.png")
      }
    } catch (error) {
      console.error("Erro ao carregar o logo:", error)
      // Usar um placeholder se o logo não puder ser carregado
      logoBuffer = new ArrayBuffer(0)
    }

    // Carregar a imagem de localização
    let locationImageBuffer: ArrayBuffer
    try {
      if (reportData.locationImage && reportData.locationImage.length > 100) {
        // Processar a imagem para garantir que seja exibido corretamente
        const processedImage = await processBase64Image(reportData.locationImage, 800, 600)
        locationImageBuffer = await urlToArrayBuffer(processedImage)
      } else {
        // Usar um placeholder
        locationImageBuffer = await urlToArrayBuffer("/placeholder.svg?key=9wn41")
      }
    } catch (error) {
      console.error("Erro ao processar imagem de localização:", error)
      // Usar um placeholder se a imagem não puder ser carregada
      locationImageBuffer = await urlToArrayBuffer("/placeholder.svg?key=9wn41")
    }

    // Criar um novo documento
    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              font: "Times New Roman",
            },
            paragraph: {
              spacing: {
                line: 276, // 1.15 espaçamento de linha
              },
            },
          },
        },
      },
      sections: [
        {
          properties: {},
          footers: {
            default: {
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Rua Fernão Albernaz 332 - apto 14 - Vila Nova Savoia – Contato: 11 97413-4386",
                      size: 16, // 8pt
                      font: "Times New Roman",
                    }),
                  ],
                  alignment: AlignmentType.LEFT,
                  border: {
                    top: {
                      style: BorderStyle.SINGLE,
                      size: 1,
                      color: "888888",
                    },
                  },
                  spacing: {
                    before: 200,
                  },
                }),
              ],
            },
          },
          children: [
            // Logo (se disponível)
            new Paragraph({
              alignment: AlignmentType.LEFT,
              children: [
                new ImageRun({
                  data: logoBuffer,
                  transformation: {
                    width: 100,
                    height: 50,
                  },
                }),
              ],
              spacing: {
                after: 200,
              },
            }),
            // Título
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: reportData.title || "VISTORIA 3: RUA BENEDITO DOS SANTOS, 44 – PARQUE SÃO JORGE – SP",
                  bold: true,
                  size: 24, // 12pt
                  font: "Times New Roman",
                }),
              ],
              spacing: {
                after: 400,
              },
            }),

            // Imagem de localização
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new ImageRun({
                  data: locationImageBuffer,
                  transformation: {
                    width: 400,
                    height: 300,
                  },
                }),
              ],
              spacing: {
                after: 200,
              },
            }),

            // Legenda da imagem
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "Localização esquemática do imóvel",
                  size: 20, // 10pt
                  font: "Times New Roman",
                }),
              ],
              spacing: {
                after: 200,
              },
              // Removidas as bordas da legenda
            }),

            // Quebra de página
            new Paragraph({
              pageBreakBefore: true,
            }),

            // Página 2 - Dados da construção
            new Paragraph({
              heading: HeadingLevel.HEADING_2,
              children: [
                new TextRun({
                  text: "Ficha com dados da construção e seus ocupantes:",
                  bold: true,
                  size: 24, // 12pt
                  font: "Times New Roman",
                }),
              ],
              spacing: {
                after: 300,
              },
            }),

            // Dados da construção
            ...createDataParagraphs(reportData),

            // Quebra de página
            new Paragraph({
              pageBreakBefore: true,
            }),

            // Página 3 - Informações técnicas
            new Paragraph({
              heading: HeadingLevel.HEADING_2,
              children: [
                new TextRun({
                  text: "Informações técnicas",
                  bold: true,
                  size: 24, // 12pt
                  font: "Times New Roman",
                }),
              ],
              spacing: {
                after: 300,
              },
            }),

            // Informações técnicas
            new Paragraph({
              children: [
                new TextRun({
                  text: reportData.technicalInfo,
                  size: 24, // 12pt
                  font: "Times New Roman",
                }),
              ],
              spacing: {
                after: 400,
              },
            }),

            // Assinatura
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: reportData.engineer,
                  size: 24, // 12pt
                  font: "Times New Roman",
                }),
              ],
              spacing: {
                before: 800,
                after: 200,
              },
            }),

            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: reportData.registration,
                  size: 24, // 12pt
                  font: "Times New Roman",
                }),
              ],
            }),
          ],
        },
      ],
    })

    if (onProgress) onProgress(50)

    // Adicionar páginas de fotos
    if (photos.length > 0) {
      // Processar fotos em pares
      for (let i = 0; i < photos.length; i += 2) {
        const photoSection = {
          properties: {},
          footers: {
            default: {
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Rua Fernão Albernaz 332 - apto 14 - Vila Nova Savoia – Contato: 11 97413-4386",
                      size: 16, // 8pt
                      font: "Times New Roman",
                    }),
                  ],
                  alignment: AlignmentType.LEFT,
                  border: {
                    top: {
                      style: BorderStyle.SINGLE,
                      size: 1,
                      color: "888888",
                    },
                  },
                  spacing: {
                    before: 200,
                  },
                }),
              ],
            },
          },
          children: [
            // Primeira foto e legenda
            ...(await createPhotoSection(photos[i], 1)),

            // Segunda foto e legenda (se existir)
            ...(i + 1 < photos.length ? await createPhotoSection(photos[i + 1], 2) : []),

            // Quebra de página (exceto na última página)
            ...(i + 2 < photos.length ? [new Paragraph({ pageBreakBefore: true })] : []),
          ],
        }

        doc.addSection(photoSection)

        if (onProgress) onProgress(50 + Math.floor(((i + 2) / photos.length) * 40))
      }
    }

    // Gerar o documento
    const buffer = await Packer.toBuffer(doc)

    // Criar um Blob e fazer o download
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" })
    FileSaver.saveAs(blob, `VISTORIA 3 - RUA BENEDITO DOS SANTOS.docx`)

    if (onProgress) onProgress(100)

    return true
  } catch (error) {
    console.error("Erro ao exportar para Word:", error)
    throw error
  }
}

// Função auxiliar para criar parágrafos de dados
function createDataParagraphs(reportData: ReportData) {
  return [
    createLabeledParagraph("Ocupante / telefone:", reportData.occupant),
    createLabeledParagraph("Vistoriador:", reportData.inspector),
    createLabeledParagraph("Uso do Imóvel:", reportData.usage),
    createLabeledParagraph("Idade real ou estimada / aparente:", reportData.age),
    createLabeledParagraph("Tipo de edificação:", reportData.buildingType),
    createLabeledParagraph("Estado de conservação:", reportData.conservationState),
    createLabeledParagraph("Padrão construtivo:", reportData.constructionStandard),
    createLabeledParagraph("Observações gerais:", reportData.observations),
    createLabeledParagraph("Data da Diligência:", reportData.date),
  ]
}

// Função auxiliar para criar um parágrafo com label e valor
function createLabeledParagraph(label: string, value: string) {
  return new Paragraph({
    children: [
      new TextRun({
        text: label + " ",
        bold: true,
        size: 24, // 12pt
        font: "Times New Roman",
      }),
      new TextRun({
        text: value,
        size: 24, // 12pt
        font: "Times New Roman",
      }),
    ],
    spacing: {
      after: 200,
    },
  })
}

// Função melhorada para criar seções de foto com melhor tratamento de erros
async function createPhotoSection(photo: Photo, position: number) {
  // Legenda da imagem (acima da foto, sem bordas)
  const captionParagraph = new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: photo.caption || "Sem legenda",
        size: 20, // 10pt
        font: "Times New Roman",
      }),
    ],
    spacing: {
      before: position === 1 ? 200 : 400,
      after: 100,
    },
  })

  // Tentar carregar a imagem com melhor tratamento de erros
  let imageParagraph: Paragraph
  try {
    // Converter a URL da imagem para um formato que o docx possa usar
    const imageBuffer = await fetchImageAsArrayBuffer(photo.url)

    // Se conseguimos obter a imagem, criar um parágrafo com a imagem
    imageParagraph = new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new ImageRun({
          data: imageBuffer,
          transformation: {
            width: 450,
            height: 280,
          },
        }),
      ],
      spacing: {
        before: 100,
        after: 200,
      },
    })
  } catch (error) {
    console.error("Erro ao processar imagem:", error)

    // Se falhar, criar um parágrafo de texto como fallback
    imageParagraph = new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "[Imagem não disponível]",
          bold: true,
          size: 24, // 12pt
          font: "Times New Roman",
        }),
      ],
      spacing: {
        before: 100,
        after: 200,
      },
    })
  }

  return [captionParagraph, imageParagraph]
}

// Função melhorada para buscar imagens com melhor tratamento de erros
async function fetchImageAsArrayBuffer(url: string): Promise<ArrayBuffer> {
  try {
    // Primeiro, verificar se a URL é válida
    if (!url || url.trim() === "") {
      throw new Error("URL de imagem vazia ou inválida")
    }

    // Tentar buscar a imagem
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Cache-Control": "no-cache",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`Falha ao buscar imagem: ${response.status} ${response.statusText}`)
    }

    // Obter o blob da imagem
    const blob = await response.blob()

    // Verificar se o blob é válido
    if (blob.size === 0) {
      throw new Error("Blob de imagem vazio")
    }

    // Converter o blob para ArrayBuffer
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result)
        } else {
          reject(new Error("Falha ao converter blob para ArrayBuffer"))
        }
      }
      reader.onerror = () => reject(new Error("Erro ao ler o blob da imagem"))
      reader.readAsArrayBuffer(blob)
    })
  } catch (error) {
    console.error("Erro ao buscar imagem:", error)

    // Criar um ArrayBuffer vazio como fallback
    // Isso permitirá que o documento seja gerado mesmo sem a imagem
    const canvas = document.createElement("canvas")
    canvas.width = 400
    canvas.height = 300
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.fillStyle = "#f0f0f0"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = "#666666"
      ctx.font = "20px Times New Roman"
      ctx.textAlign = "center"
      ctx.fillText("Imagem não disponível", canvas.width / 2, canvas.height / 2)

      const dataUrl = canvas.toDataURL("image/png")
      const response = await fetch(dataUrl)
      const blob = await response.blob()

      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as ArrayBuffer)
        reader.onerror = reject
        reader.readAsArrayBuffer(blob)
      })
    } else {
      throw new Error("Não foi possível criar um canvas para a imagem de fallback")
    }
  }
}
