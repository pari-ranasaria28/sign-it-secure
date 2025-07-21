import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pen, RotateCcw, Check, X } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';

interface SignatureCaptureProps {
  onComplete: (signatureData: string) => void;
  onCancel: () => void;
  signerName?: string;
  signerEmail?: string;
}

export function SignatureCapture({ 
  onComplete, 
  onCancel, 
  signerName: initialSignerName = '',
  signerEmail: initialSignerEmail = ''
}: SignatureCaptureProps) {
  const [signerName, setSignerName] = useState(initialSignerName);
  const [signerEmail, setSignerEmail] = useState(initialSignerEmail);
  const [signatureMode, setSignatureMode] = useState<'draw' | 'type'>('draw');
  const [typedSignature, setTypedSignature] = useState('');
  const canvasRef = useRef<SignatureCanvas>(null);

  const clearSignature = () => {
    if (canvasRef.current) {
      canvasRef.current.clear();
    }
    setTypedSignature('');
  };

  const handleComplete = () => {
    let signatureData = '';
    
    if (signatureMode === 'draw') {
      if (canvasRef.current && !canvasRef.current.isEmpty()) {
        signatureData = canvasRef.current.toDataURL('image/png');
      }
    } else {
      if (typedSignature.trim()) {
        // Create a simple typed signature image
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#000000';
          ctx.font = '24px cursive';
          ctx.textAlign = 'center';
          ctx.fillText(typedSignature, 200, 60);
          signatureData = canvas.toDataURL('image/png');
        }
      }
    }

    if (!signatureData) {
      return;
    }

    onComplete(signatureData);
  };

  const hasSignature = signatureMode === 'draw' 
    ? canvasRef.current && !canvasRef.current.isEmpty()
    : typedSignature.trim().length > 0;

  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Pen className="h-5 w-5 mr-2" />
            Complete Your Signature
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Signer Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="signerName">Full Name</Label>
              <Input
                id="signerName"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <Label htmlFor="signerEmail">Email Address</Label>
              <Input
                id="signerEmail"
                type="email"
                value={signerEmail}
                onChange={(e) => setSignerEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>
          </div>

          {/* Signature Mode Toggle */}
          <div className="flex space-x-2">
            <Button
              variant={signatureMode === 'draw' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSignatureMode('draw')}
            >
              Draw Signature
            </Button>
            <Button
              variant={signatureMode === 'type' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSignatureMode('type')}
            >
              Type Signature
            </Button>
          </div>

          {/* Signature Input */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                {signatureMode === 'draw' ? 'Draw your signature below' : 'Type your signature'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {signatureMode === 'draw' ? (
                <div className="border border-border rounded-md">
                  <SignatureCanvas
                    ref={canvasRef}
                    canvasProps={{
                      width: 500,
                      height: 200,
                      className: 'signature-canvas w-full h-48 rounded-md',
                    }}
                    backgroundColor="white"
                    penColor="black"
                  />
                </div>
              ) : (
                <Input
                  value={typedSignature}
                  onChange={(e) => setTypedSignature(e.target.value)}
                  placeholder="Type your full name"
                  className="text-2xl font-signature text-center py-8"
                  style={{ fontFamily: 'cursive' }}
                />
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <div className="flex space-x-2">
              <Button variant="outline" onClick={clearSignature}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                onClick={handleComplete}
                disabled={!hasSignature || !signerName.trim() || !signerEmail.trim()}
              >
                <Check className="h-4 w-4 mr-2" />
                Complete Signature
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}