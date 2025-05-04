import FileSaver from "file-saver"
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  ImageRun,
  HeadingLevel,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  PageNumber,
  Footer,
  Header,
} from "docx"
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

// Função para converter URL para ArrayBuffer
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

// Função para processar imagens base64
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

// Função para criar um placeholder de imagem
async function createPlaceholderImage(text: string): Promise<ArrayBuffer> {
  const canvas = document.createElement("canvas")
  canvas.width = 400
  canvas.height = 300
  const ctx = canvas.getContext("2d")

  if (!ctx) {
    return new ArrayBuffer(0)
  }

  // Fundo branco
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Borda cinza
  ctx.strokeStyle = "#cccccc"
  ctx.lineWidth = 2
  ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4)

  // Texto em cinza escuro
  ctx.fillStyle = "#666666"
  ctx.font = "20px Arial"
  ctx.textAlign = "center"
  ctx.fillText(text, canvas.width / 2, canvas.height / 2)

  const dataUrl = canvas.toDataURL("image/png")
  const response = await fetch(dataUrl)
  const blob = await response.blob()

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = reject
    reader.readAsArrayBuffer(blob)
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
          // Adicionar o logo ao PDF - tamanho padronizado
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
        // Adicionar o logo ao PDF - tamanho padronizado
        doc.addImage(processedLogo, "JPEG", 20, 20, 40, 20)
      }
    }
  } catch (error) {
    console.error("Erro ao adicionar logo à página:", error)
  }
}

// Função auxiliar para adicionar a página de dados ao PDF
async function addDataPage(doc: jsPDF, reportData: ReportData) {
  // Adicionar o logo no canto superior esquerdo
  await addLogoToPage(doc, reportData)

  // Título da seção - MOVIDO PARA BAIXO DO LOGO
  doc.setFontSize(14)
  doc.setFont("times", "bold")
  doc.text("Ficha com dados da construção e seus ocupantes:", 20, 50)

  // Dados da construção - AJUSTADOS PARA COMEÇAR ABAIXO DO TÍTULO
  doc.setFontSize(12)
  doc.setFont("times", "bold")
  doc.text("Ocupante / telefone:", 20, 65)
  doc.setFont("times", "normal")
  doc.text(reportData.occupant || "N/A", 70, 65)

  doc.setFont("times", "bold")
  doc.text("Vistoriador:", 20, 75)
  doc.setFont("times", "normal")
  doc.text(reportData.inspector || "N/A", 70, 75)

  doc.setFont("times", "bold")
  doc.text("Uso do Imóvel:", 20, 85)
  doc.setFont("times", "normal")
  doc.text(reportData.usage || "N/A", 70, 85)

  doc.setFont("times", "bold")
  doc.text("Idade real ou estimada / aparente:", 20, 95)
  doc.setFont("times", "normal")
  doc.text(reportData.age || "N/A", 100, 95)

  doc.setFont("times", "bold")
  doc.text("Tipo de edificação:", 20, 105)
  doc.setFont("times", "normal")
  doc.text(reportData.buildingType || "N/A", 70, 105)

  doc.setFont("times", "bold")
  doc.text("Estado de conservação:", 20, 115)
  doc.setFont("times", "normal")
  doc.text(reportData.conservationState || "N/A", 70, 115)

  doc.setFont("times", "bold")
  doc.text("Padrão construtivo:", 20, 125)
  doc.setFont("times", "normal")
  doc.text(reportData.constructionStandard || "N/A", 70, 125)

  doc.setFont("times", "bold")
  doc.text("Observações gerais:", 20, 140)
  doc.setFont("times", "normal")
  doc.text(reportData.observations || "N/A", 20, 150, { maxWidth: 170 })

  doc.setFont("times", "bold")
  doc.text("Data da Diligência:", 20, 170)
  doc.setFont("times", "normal")
  doc.text(reportData.date || "N/A", 70, 170)

  // Rodapé com número da página
  doc.setFontSize(10)
  doc.setFont("times", "normal")
  doc.line(20, 280, 190, 280)
  doc.text("Rua Fernão Albernaz 332 - apto 14 - Vila Nova Savoia – Contato: 11 97413-4386", 20, 287)
  doc.text("2", 190, 287, { align: "right" })
}

// Função auxiliar para adicionar a página de informações técnicas ao PDF
async function addTechnicalInfoPage(doc: jsPDF, reportData: ReportData) {
  // Adicionar o logo no canto superior esquerdo
  await addLogoToPage(doc, reportData)

  // Título da seção - MOVIDO PARA BAIXO DO LOGO
  doc.setFontSize(14)
  doc.setFont("times", "bold")
  doc.text("Informações técnicas", 20, 50)

  // Informações técnicas - AJUSTADAS PARA COMEÇAR ABAIXO DO TÍTULO
  doc.setFontSize(12)
  doc.setFont("times", "normal")

  // Dividir o texto em linhas para melhor formatação
  const textLines = doc.splitTextToSize(reportData.technicalInfo || "Nenhuma informação técnica disponível.", 170)
  doc.text(textLines, 20, 65)

  // Assinatura
  doc.setFontSize(12)
  doc.text(reportData.engineer || "Engenheiro Responsável", 105, 240, { align: "center" })
  doc.text(reportData.registration || "Registro Profissional", 105, 250, { align: "center" })

  // Rodapé com número da página
  doc.setFontSize(10)
  doc.setFont("times", "normal")
  doc.line(20, 280, 190, 280)
  doc.text("Rua Fernão Albernaz 332 - apto 14 - Vila Nova Savoia – Contato: 11 97413-4386", 20, 287)
  doc.text("3", 190, 287, { align: "right" })
}

// Função auxiliar para adicionar a página de fotos ao PDF
async function addPhotoPage(doc: jsPDF, photos: Photo[], pageNumber: number, reportData: any) {
  // Adicionar o logo no canto superior esquerdo
  await addLogoToPage(doc, reportData)

  // Primeira foto (se existir) - AJUSTADA PARA COMEÇAR ABAIXO DO LOGO
  if (photos.length > 0) {
    try {
      // Adicionar a legenda ANTES da foto (sem retângulo)
      doc.setFontSize(11)
      doc.setFont("times", "normal")
      // Remover o retângulo para a legenda - AJUSTADA PARA COMEÇAR ABAIXO DO LOGO
      doc.text(photos[0].caption || "Sem legenda", 105, 50, { align: "center", maxWidth: 150 })

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
        doc.addImage(imgData, "PNG", 30, 60, 150, 90)
      } else {
        // Fallback se o contexto do canvas não estiver disponível
        doc.setFillColor(240, 240, 240)
        doc.rect(30, 60, 150, 90, "F")
        doc.setFontSize(12)
        doc.text("Imagem não disponível", 105, 105, { align: "center" })
      }
    } catch (error) {
      console.warn("Erro ao adicionar imagem ao PDF:", error)

      // Adicionar um placeholder se a imagem falhar
      doc.setFillColor(240, 240, 240)
      doc.rect(30, 60, 150, 90, "F")
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
      doc.text(photos[1].caption || "Sem legenda", 105, 170, { align: "center", maxWidth: 150 })

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
        doc.addImage(imgData, "PNG", 30, 180, 150, 90)
      } else {
        // Fallback se o contexto do canvas não estiver disponível
        doc.setFillColor(240, 240, 240)
        doc.rect(30, 180, 150, 90, "F")
        doc.setFontSize(12)
        doc.text("Imagem não disponível", 105, 235, { align: "center" })
      }
    } catch (error) {
      console.warn("Erro ao adicionar imagem ao PDF:", error)

      // Adicionar um placeholder se a imagem falhar
      doc.setFillColor(240, 240, 240)
      doc.rect(30, 180, 150, 90, "F")
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

    // Criar um ArrayBuffer com uma imagem placeholder com fundo branco
    const canvas = document.createElement("canvas")
    canvas.width = 400
    canvas.height = 300
    const ctx = canvas.getContext("2d")
    if (ctx) {
      // Fundo branco
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      // Borda cinza
      ctx.strokeStyle = "#cccccc"
      ctx.lineWidth = 2
      ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4)
      // Texto em cinza escuro
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
      // Retornar um buffer vazio se não conseguir criar o canvas
      return new ArrayBuffer(0)
    }
  }
}

// Função para exportar para Word diretamente
export async function exportToWord(reportData: ReportData, photos: Photo[], onProgress?: (progress: number) => void) {
  try {
    if (onProgress) onProgress(10)

    console.log("Iniciando exportação direta para Word")

    // Criar um rodapé padrão
    const footer = new Footer({
      children: [
        new Paragraph({
          children: [
            new TextRun("Rua Fernão Albernaz 332 - apto 14 - Vila Nova Savoia – Contato: 11 97413-4386"),
            new TextRun({
              children: ["Página ", PageNumber.CURRENT],
              alignment: AlignmentType.RIGHT,
            }),
          ],
          border: {
            top: {
              style: BorderStyle.SINGLE,
              size: 1,
              color: "000000",
            },
          },
        }),
      ],
    })

    // Preparar o logo para o cabeçalho (se disponível)
    let logoImageRun = null
    if (reportData.logoImage && reportData.logoImage.length > 100) {
      try {
        // Processar o logo para garantir que seja exibido corretamente
        const processedLogo = await processBase64Image(reportData.logoImage, 200, 80)

        if (processedLogo) {
          const logoBuffer = await urlToArrayBuffer(processedLogo)
          const logoBlob = new Blob([logoBuffer], { type: "image/jpeg" })
          const logoUrl = URL.createObjectURL(logoBlob)

          logoImageRun = new ImageRun({
            data: logoBuffer,
            transformation: {
              width: 100,
              height: 50,
            },
          })
        }
      } catch (error) {
        console.error("Erro ao processar logo para Word:", error)
      }
    }

    // Criar um cabeçalho com o logo
    const header = new Header({
      children: [
        new Paragraph({
          children: logoImageRun ? [logoImageRun] : [new TextRun("")],
          alignment: AlignmentType.LEFT,
        }),
      ],
    })

    // Criar um documento Word
    const doc = new Document({
      sections: [
        {
          properties: {},
          headers: {
            default: header,
          },
          footers: {
            default: footer,
          },
          children: [],
        },
      ],
    })

    // Preparar os elementos do documento
    const docElements = []

    // Título
    docElements.push(
      new Paragraph({
        text: reportData.title || "VISTORIA 3: RUA BENEDITO DOS SANTOS, 44 – PARQUE SÃO JORGE – SP",
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: {
          after: 400,
        },
      }),
    )

    // Adicionar imagem de localização se disponível
    if (reportData.locationImage && reportData.locationImage.length > 100) {
      try {
        const processedImage = await processBase64Image(reportData.locationImage, 800, 600)
        if (processedImage) {
          const imageBuffer = await urlToArrayBuffer(processedImage)
          docElements.push(
            new Paragraph({
              children: [
                new ImageRun({
                  data: imageBuffer,
                  transformation: {
                    width: 400,
                    height: 250,
                  },
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: {
                after: 200,
              },
            }),
          )
          docElements.push(
            new Paragraph({
              text: "Localização esquemática do imóvel",
              alignment: AlignmentType.CENTER,
              spacing: {
                after: 400,
              },
            }),
          )
        }
      } catch (error) {
        console.error("Erro ao adicionar imagem de localização ao Word:", error)
      }
    }

    // Dados da construção
    docElements.push(
      new Paragraph({
        text: "Ficha com dados da construção e seus ocupantes:",
        heading: HeadingLevel.HEADING_2,
        spacing: {
          after: 200,
        },
      }),
    )

    // Tabela de dados
    docElements.push(
      new Table({
        width: {
          size: 100,
          type: WidthType.PERCENTAGE,
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph("Ocupante / telefone:")],
                width: {
                  size: 30,
                  type: WidthType.PERCENTAGE,
                },
              }),
              new TableCell({
                children: [new Paragraph(reportData.occupant || "N/A")],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph("Vistoriador:")],
              }),
              new TableCell({
                children: [new Paragraph(reportData.inspector || "N/A")],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph("Uso do Imóvel:")],
              }),
              new TableCell({
                children: [new Paragraph(reportData.usage || "N/A")],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph("Idade real ou estimada / aparente:")],
              }),
              new TableCell({
                children: [new Paragraph(reportData.age || "N/A")],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph("Tipo de edificação:")],
              }),
              new TableCell({
                children: [new Paragraph(reportData.buildingType || "N/A")],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph("Estado de conservação:")],
              }),
              new TableCell({
                children: [new Paragraph(reportData.conservationState || "N/A")],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph("Padrão construtivo:")],
              }),
              new TableCell({
                children: [new Paragraph(reportData.constructionStandard || "N/A")],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph("Observações gerais:")],
              }),
              new TableCell({
                children: [new Paragraph(reportData.observations || "N/A")],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph("Data da Diligência:")],
              }),
              new TableCell({
                children: [new Paragraph(reportData.date || "N/A")],
              }),
            ],
          }),
        ],
      }),
    )

    // Informações técnicas (em nova página)
    docElements.push(
      new Paragraph({
        text: "Informações técnicas",
        heading: HeadingLevel.HEADING_2,
        pageBreakBefore: true,
        spacing: {
          after: 200,
        },
      }),
    )

    docElements.push(
      new Paragraph({
        text: reportData.technicalInfo || "Nenhuma informação técnica disponível.",
        spacing: {
          after: 400,
        },
      }),
    )

    // Assinatura
    docElements.push(
      new Paragraph({
        text: reportData.engineer || "Engenheiro Responsável",
        alignment: AlignmentType.CENTER,
        spacing: {
          before: 400,
          after: 100,
        },
      }),
    )

    docElements.push(
      new Paragraph({
        text: reportData.registration || "Registro Profissional",
        alignment: AlignmentType.CENTER,
        spacing: {
          after: 400,
        },
      }),
    )

    // Adicionar fotos (se houver)
    if (photos && photos.length > 0) {
      // Título da seção de fotos (em nova página)
      docElements.push(
        new Paragraph({
          text: "Fotos do Imóvel",
          heading: HeadingLevel.HEADING_2,
          pageBreakBefore: true,
          spacing: {
            after: 400,
          },
        }),
      )

      // Processar cada foto individualmente
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i]

        // Adicionar legenda da foto
        docElements.push(
          new Paragraph({
            text: photo.caption || "Sem legenda",
            alignment: AlignmentType.CENTER,
            spacing: {
              before: 200,
              after: 100,
            },
          }),
        )

        // Tentar adicionar a imagem
        try {
          if (photo.url && photo.url.length > 10) {
            const imageBuffer = await fetchImageAsArrayBuffer(photo.url)

            docElements.push(
              new Paragraph({
                children: [
                  new ImageRun({
                    data: imageBuffer,
                    transformation: {
                      width: 400,
                      height: 250,
                    },
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: {
                  after: 200,
                },
              }),
            )
          }
        } catch (error) {
          console.error(`Erro ao adicionar foto ${i + 1} ao Word:`, error)

          // Adicionar mensagem de erro se a imagem falhar
          docElements.push(
            new Paragraph({
              text: "[Imagem não disponível]",
              alignment: AlignmentType.CENTER,
              spacing: {
                after: 200,
              },
            }),
          )
        }

        // Adicionar quebra de página a cada duas fotos
        if (i % 2 === 1 && i < photos.length - 1) {
          docElements.push(
            new Paragraph({
              text: "",
              pageBreakAfter: true,
            }),
          )
        }
      }
    }

    // Adicionar todos os elementos ao documento
    doc.sections[0].children = docElements

    if (onProgress) onProgress(80)

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

// Função auxiliar para preparar o buffer de uma foto
async function preparePhotoBuffer(photo: Photo): Promise<ArrayBuffer> {
  try {
    if (!photo || !photo.url) {
      throw new Error("Foto inválida ou URL ausente")
    }

    return await fetchImageAsArrayBuffer(photo.url)
  } catch (error) {
    console.error("Erro ao preparar buffer de foto:", error)

    // Criar um placeholder para a foto com fundo branco
    const canvas = document.createElement("canvas")
    canvas.width = 400
    canvas.height = 300
    const ctx = canvas.getContext("2d")
    if (ctx) {
      // Fundo branco
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      // Borda cinza
      ctx.strokeStyle = "#cccccc"
      ctx.lineWidth = 2
      ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4)
      // Texto em cinza escuro
      ctx.fillStyle = "#666666"
      ctx.font = "20px Arial"
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
    }
    return new ArrayBuffer(0)
  }
}
