import { useState, useRef, useCallback } from 'react'
import { Upload, Link, Loader2, FileUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAddTorrent } from '@/hooks/useApi'
import { toast } from '@/hooks/use-toast'

export function AddTorrentView() {
  const [url, setUrl] = useState('')
  const [category, setCategory] = useState('')
  const [savePath, setSavePath] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const addTorrent = useAddTorrent()

  const handleSubmitUrl = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url) return
    try {
      await addTorrent.mutateAsync({ url, category, savePath })
      toast.success('Torrent added successfully')
      setUrl('')
    } catch {
      toast.error('Failed to add torrent')
    }
  }

  const handleSubmitFile = async (e: React.FormEvent) => {
    e.preventDefault()
    const file = selectedFile || fileInputRef.current?.files?.[0]
    if (!file) return
    try {
      await addTorrent.mutateAsync({ file, category, savePath })
      toast.success('Torrent added successfully')
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch {
      toast.error('Failed to add torrent')
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.name.endsWith('.torrent')) {
      setSelectedFile(file)
    } else {
      toast.error('Please drop a .torrent file')
    }
  }, [])

  const sharedFields = (
    <>
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Input
          id="category"
          placeholder="e.g. movies"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="savePath">Save Path</Label>
        <Input
          id="savePath"
          placeholder="Leave empty for default"
          value={savePath}
          onChange={(e) => setSavePath(e.target.value)}
        />
      </div>
    </>
  )

  return (
    <div className="max-w-md mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Add Torrent</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="url">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="url" className="flex-1 gap-2">
                <Link className="h-4 w-4" />
                URL / Magnet
              </TabsTrigger>
              <TabsTrigger value="file" className="flex-1 gap-2">
                <Upload className="h-4 w-4" />
                File
              </TabsTrigger>
            </TabsList>

            <TabsContent value="url">
              <form onSubmit={handleSubmitUrl} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="url">Torrent URL or magnet link</Label>
                  <Input
                    id="url"
                    type="text"
                    placeholder="magnet:?xt=... or https://..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                  />
                </div>
                {sharedFields}
                <Button type="submit" className="w-full" disabled={addTorrent.isPending}>
                  {addTorrent.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Torrent
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="file">
              <form onSubmit={handleSubmitFile} className="space-y-4">
                {/* Drag & Drop zone */}
                <div
                  className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${
                    dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileUp className={`h-10 w-10 ${dragOver ? 'text-primary' : 'text-muted-foreground'}`} />
                  {selectedFile ? (
                    <div className="text-center">
                      <p className="text-sm font-medium text-primary truncate max-w-[240px]">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">Click to change</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm font-medium">Drop .torrent file here</p>
                      <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".torrent"
                    className="hidden"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                  />
                </div>
                {sharedFields}
                <Button type="submit" className="w-full" disabled={addTorrent.isPending || (!selectedFile && !fileInputRef.current?.files?.[0])}>
                  {addTorrent.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Torrent
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
