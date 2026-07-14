/**
 * Custom lightweight regex-based Markdown parser
 * Renders standard Markdown features into styled HTML tags
 */
export function parseMarkdown(text) {
  if (!text) return '';
  
  // Escape HTML tags to prevent XSS
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
    
  // Headers (must match start of line ^)
  html = html.replace(/^### (.*?)$/gm, '<h3 class="text-sm font-bold text-zinc-300 mt-5 mb-2">$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2 class="text-base font-bold text-zinc-200 mt-6 mb-2.5 border-b border-zinc-900 pb-1">$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1 class="text-lg font-bold text-zinc-100 mt-7 mb-3 border-b border-zinc-850 pb-2">$1</h1>');
  
  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr class="border-zinc-800 my-6" />');
  
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-zinc-100">$1</strong>');
  
  // Inline code
  html = html.replace(/`(.*?)`/g, '<code class="bg-zinc-950 border border-zinc-850 rounded px-1.5 py-0.5 text-xs text-indigo-400 font-mono">$1</code>');
  
  // Links: [text](url)
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noreferrer" class="text-indigo-400 hover:text-indigo-300 hover:underline inline-flex items-center gap-0.5">$1 <svg class="h-3 w-3 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3"/></svg></a>');
  
  // Checked checklist items: - [x] task or * [x] task
  html = html.replace(/^[-*] \[x\] (.*?)$/gmi, '<li class="ml-4 list-none pl-1 text-zinc-400 leading-6 line-through flex items-center gap-2"><span class="text-green-500 font-bold">✓</span> $1</li>');
  
  // Unchecked checklist items: - [ ] task or * [ ] task
  html = html.replace(/^[-*] \[ \] (.*?)$/gmi, '<li class="ml-4 list-none pl-1 text-zinc-300 leading-6 flex items-center gap-2"><span class="inline-block h-3.5 w-3.5 border border-zinc-700 rounded-sm shrink-0"></span> $1</li>');

  // Bullet points
  html = html.replace(/^[-*] (.*?)$/gm, '<li class="ml-4 list-disc pl-1 text-zinc-305 leading-6">$1</li>');
  
  // Paragraph line breaks
  html = html.replace(/\n/g, '<br />');
  
  return html;
}

export function stripMarkdown(text) {
  if (!text) return '';
  return text
    // Remove headers
    .replace(/^#+\s+/gm, '')
    // Remove bold/italic symbols
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    // Remove links [text](url) -> text
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    // Remove inline code `code` -> code
    .replace(/`([^`]+)`/g, '$1')
    // Remove checklist/list markers
    .replace(/^[-*]\s+\[[ x]\]\s+/gmi, '')
    .replace(/^[-*]\s+/gm, '')
    // Remove horizontal rules
    .replace(/^---$/gm, '')
    // Replace newlines with spaces so it reads as a continuous sentence
    .replace(/\n+/g, ' ')
    .trim();
}
