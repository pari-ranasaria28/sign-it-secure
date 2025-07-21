
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Share, Plus, Eye, Download } from "lucide-react";
import { PDFViewer } from "@/components/pdf/PDFViewer";
import { SignatureField } from "@/components/pdf/SignatureField";

interface Document {
  id: string;
  title: string;
  description: string;
  file_name: string;
  file_path: string;
  status: 'draft' | 'pending' | 'completed' | 'cancelled';
  created_at: string;
}

interface Signature {
  id: string;
  signer_email: string;
  signer_name: string;
  status: 'pending' | 'signed' | 'rejected';
  x_position: number;
  y_position: number;
  page_number: number;
  width: number;
  height: number;
  signed_at: string | null;
}

interface DocumentViewerProps {
  document: Document;
  onBack: () => void;
  onUpdate: () => void;
}

export function DocumentViewer({ document, onBack, onUpdate }: DocumentViewerProps) {
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddSigner, setShowAddSigner] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    fetchSignatures();
  }, [document.id]);

  const fetchSignatures = async () => {
    try {
      const { data, error } = await supabase
        .from('signatures')
        .select('*')
        .eq('document_id', document.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSignatures(data as Signature[] || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch signatures",
        variant: "destructive",
      });
    }
  };

  const handleAddSigner = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const signerEmail = formData.get("signerEmail") as string;
    const signerName = formData.get("signerName") as string;

    try {
      const { error } = await supabase
        .from('signatures')
        .insert({
          document_id: document.id,
          signer_email: signerEmail,
          signer_name: signerName,
          x_position: 100,
          y_position: 100,
          page_number: currentPage,
          width: 150,
          height: 50,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Signer added successfully",
      });

      setShowAddSigner(false);
      fetchSignatures();
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMoveSignature = async (signatureId: string, x: number, y: number) => {
    try {
      const { error } = await supabase
        .from('signatures')
        .update({ x_position: x, y_position: y })
        .eq('id', signatureId);

      if (error) throw error;

      // Update local state
      setSignatures(prev => 
        prev.map(sig => 
          sig.id === signatureId 
            ? { ...sig, x_position: x, y_position: y }
            : sig
        )
      );
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update signature position",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSignature = async (signatureId: string) => {
    try {
      const { error } = await supabase
        .from('signatures')
        .delete()
        .eq('id', signatureId);

      if (error) throw error;

      setSignatures(prev => prev.filter(sig => sig.id !== signatureId));
      toast({
        title: "Success",
        description: "Signature field removed",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to remove signature field",
        variant: "destructive",
      });
    }
  };

  const downloadDocument = async () => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(document.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.file_name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'signed':
        return 'text-accent';
      case 'pending':
        return 'text-warning';
      case 'rejected':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{document.title}</h1>
              <p className="text-muted-foreground">{document.description}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={downloadDocument} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="outline">
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button onClick={() => setShowAddSigner(true)} variant="hero">
                <Plus className="h-4 w-4 mr-2" />
                Add Signer
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Document Preview */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="h-5 w-5 mr-2" />
                  Document Preview
                </CardTitle>
                <CardDescription>
                  PDF viewer with signature field placement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <PDFViewer
                    filePath={document.file_path}
                    fileName={document.file_name}
                    currentPage={currentPage}
                    zoom={zoom}
                    onPageChange={setCurrentPage}
                    onZoomChange={setZoom}
                  />
                  
                  {/* Signature Fields Overlay */}
                  {signatures
                    .filter(sig => sig.page_number === currentPage)
                    .map(signature => (
                      <SignatureField
                        key={signature.id}
                        id={signature.id}
                        x={signature.x_position}
                        y={signature.y_position}
                        width={signature.width}
                        height={signature.height}
                        signerName={signature.signer_name}
                        signerEmail={signature.signer_email}
                        status={signature.status}
                        onMove={handleMoveSignature}
                        onDelete={handleDeleteSignature}
                      />
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Signatures Panel */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Signatures ({signatures.length})</CardTitle>
                <CardDescription>
                  Manage document signers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {signatures.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No signers added yet</p>
                    <Button onClick={() => setShowAddSigner(true)} variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Signer
                    </Button>
                  </div>
                ) : (
                  signatures.map((signature) => (
                    <div key={signature.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-sm">{signature.signer_name}</p>
                        <span className={`text-xs font-medium capitalize ${getStatusColor(signature.status)}`}>
                          {signature.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{signature.signer_email}</p>
                      <p className="text-xs text-muted-foreground">
                        Page {signature.page_number} • Position ({Math.round(signature.x_position)}, {Math.round(signature.y_position)})
                      </p>
                      {signature.signed_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Signed: {new Date(signature.signed_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))
                )}

                {showAddSigner && (
                  <Card className="mt-4">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">Add Signer</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleAddSigner} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="signerName">Name</Label>
                          <Input
                            id="signerName"
                            name="signerName"
                            placeholder="Signer's full name"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signerEmail">Email</Label>
                          <Input
                            id="signerEmail"
                            name="signerEmail"
                            type="email"
                            placeholder="signer@example.com"
                            required
                          />
                        </div>
                        <div className="flex space-x-2">
                          <Button type="submit" size="sm" disabled={loading}>
                            {loading ? "Adding..." : "Add Signer"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAddSigner(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>

            {/* Document Info */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Document Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <p className="text-sm text-muted-foreground capitalize">{document.status}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(document.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">File Name</p>
                  <p className="text-sm text-muted-foreground">{document.file_name}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
