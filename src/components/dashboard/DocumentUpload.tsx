import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, FileText } from "lucide-react";

interface DocumentUploadProps {
  onBack: () => void;
  onSuccess: () => void;
}

export function DocumentUpload({ onBack, onSuccess }: DocumentUploadProps) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        toast({
          title: "Invalid file type",
          description: "Please select a PDF file",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create document record
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          title,
          description,
          file_name: file.name,
          file_path: uploadData.path,
          file_size: file.size,
          status: 'draft'
        });

      if (dbError) throw dbError;

      toast({
        title: "Success!",
        description: "Document uploaded successfully",
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button onClick={onBack} variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold">Upload Document</h1>
          <p className="text-muted-foreground">Upload a PDF document for signature</p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Document Details</CardTitle>
            <CardDescription>
              Provide information about your document
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Document Title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Enter document title"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Brief description of the document"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">PDF File</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  {file ? (
                    <div className="flex items-center justify-center space-x-2">
                      <FileText className="h-8 w-8 text-primary" />
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium mb-2">Choose a PDF file</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Drag and drop or click to select
                      </p>
                    </div>
                  )}
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="mt-4"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={onBack}>
                  Cancel
                </Button>
                <Button type="submit" variant="hero" disabled={loading || !file}>
                  {loading ? "Uploading..." : "Upload Document"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}