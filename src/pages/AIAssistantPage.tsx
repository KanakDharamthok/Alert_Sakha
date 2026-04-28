import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import AppLayout from '@/components/layout/AppLayout';

export default function AIAssistantPage() {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      toast({ title: 'Prompt required', description: 'Please enter a prompt.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    setResult('');
    try {
      const { data, error } = await supabase.functions.invoke('generateAIResponse', {
        body: { prompt: prompt.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data?.result ?? '');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate response';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" /> AI Assistant
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ask anything — powered by Gemini 1.5 Flash via a secure backend function.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border p-5 card-shadow space-y-3">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type your prompt here..."
            rows={4}
            maxLength={4000}
            className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{prompt.length}/4000</span>
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {loading ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </form>

        {result && (
          <div className="bg-card rounded-xl border border-border p-5 card-shadow">
            <h2 className="font-display font-semibold text-foreground mb-3">Response</h2>
            <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{result}</div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}