'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Trash2, Loader2, MessageSquare, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getVoiceVaultEntries, deleteVoiceVaultEntry } from '@/features/voice-vault/actions';

interface VaultEntry {
  id: number;
  content: string;
  contextTags: unknown;
  createdAt: Date;
}

export default function VoiceVaultPage() {
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [tags, setTags] = useState<string[]>(['whatsapp']);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = async () => {
    try {
      const data = await getVoiceVaultEntries();
      setEntries(data as VaultEntry[]);
    } catch (err) {
      console.error('Failed to fetch entries', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleSubmit = async () => {
    if (!inputText.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/voice-vault/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: inputText,
          contextTags: tags,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save to Voice Vault');
      }

      setInputText('');
      await fetchEntries();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteVoiceVaultEntry(id);
      setEntries(entries.filter(e => e.id !== id));
    } catch (err) {
      console.error('Failed to delete entry', err);
    }
  };

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <Card>
        <CardHeader>
          <CardTitle>Deposit to Vault</CardTitle>
          <CardDescription>Paste a message you have sent to a client in the past.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea 
            placeholder="Paste your past message here... (e.g. 'Hey John, just a quick reminder about invoice #100. Let me know if you need anything!')"
            className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            value={inputText}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setInputText(e.target.value)}
          />
          
          <div className="space-y-2">
            <p className="text-sm font-medium">Context Tags (Select all that apply)</p>
            <div className="flex flex-wrap gap-2">
              <Button 
                type="button" 
                variant={tags.includes('whatsapp') ? 'primary' : 'outline'} 
                size="sm"
                onClick={() => toggleTag('whatsapp')}
              >
                <MessageSquare className="w-4 h-4 mr-2" /> WhatsApp
              </Button>
              <Button 
                type="button" 
                variant={tags.includes('email') ? 'primary' : 'outline'} 
                size="sm"
                onClick={() => toggleTag('email')}
              >
                <Mail className="w-4 h-4 mr-2" /> Email
              </Button>
              <Button 
                type="button" 
                variant={tags.includes('friendly') ? 'primary' : 'outline'} 
                size="sm"
                onClick={() => toggleTag('friendly')}
              >
                Friendly
              </Button>
              <Button 
                type="button" 
                variant={tags.includes('firm') ? 'primary' : 'outline'} 
                size="sm"
                onClick={() => toggleTag('firm')}
              >
                Firm / Overdue
              </Button>
            </div>
          </div>

          {error && (
            <div className="flex items-center text-destructive text-sm mt-2">
              <AlertCircle className="w-4 h-4 mr-2" />
              {error}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleSubmit} disabled={submitting || inputText.trim().length < 5}>
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
            Deposit & Train MIRA
          </Button>
        </CardFooter>
      </Card>

      <div className="space-y-4 mt-8">
        <h3 className="text-xl font-semibold">Your Encrypted Vault</h3>
        
        {loading ? (
          <div className="flex justify-center p-8 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center p-8 border border-dashed rounded-lg text-muted-foreground">
            <p>Your vault is empty. Deposit some examples above to train MIRA.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {entries.map(entry => (
              <Card key={entry.id} className="relative overflow-hidden group">
                <CardContent className="p-4">
                  <p className="text-sm line-clamp-4 whitespace-pre-wrap">{entry.content}</p>
                  
                  <div className="flex flex-wrap gap-1 mt-4">
                    {Array.isArray(entry.contextTags) && entry.contextTags.map((tag, idx) => (
                      <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(entry.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
