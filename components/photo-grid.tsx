"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { GripVertical, X } from "lucide-react"

interface PhotoGridProps {
  photos: { id: string; url: string; caption: string }[]
  onUpdateCaption: (id: string, caption: string) => void
  onReorder: (photos: { id: string; url: string; caption: string }[]) => void
}

export function PhotoGrid({ photos, onUpdateCaption, onReorder }: PhotoGridProps) {
  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(photos)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    onReorder(items)
  }

  const handleCaptionChange = (id: string, caption: string) => {
    onUpdateCaption(id, caption)
  }

  const handleRemovePhoto = (id: string) => {
    const updatedPhotos = photos.filter((photo) => photo.id !== id)
    onReorder(updatedPhotos)
  }

  if (photos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fotos do Laudo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <p className="text-muted-foreground mb-2">Nenhuma foto adicionada ao laudo ainda.</p>
            <p className="text-sm text-muted-foreground">Use o uploader acima para adicionar fotos ao seu laudo.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fotos do Laudo ({photos.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="photos">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                {photos.map((photo, index) => (
                  <Draggable key={photo.id} draggableId={photo.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="flex items-start gap-4 p-4 border rounded-lg bg-card"
                      >
                        <div {...provided.dragHandleProps} className="flex items-center self-center">
                          <GripVertical className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="w-24 h-24 rounded-md overflow-hidden flex-shrink-0">
                          <img
                            src={photo.url || "/placeholder.svg"}
                            alt={`Photo ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">Foto {index + 1}</p>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleRemovePhoto(photo.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Legenda</label>
                            <Input
                              value={photo.caption}
                              onChange={(e) => handleCaptionChange(photo.id, e.target.value)}
                              placeholder="Adicione uma legenda para esta foto..."
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </CardContent>
    </Card>
  )
}
