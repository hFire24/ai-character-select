import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Character } from '../../services/character.service';
import { CommonModule } from '@angular/common';

const FALLBACK_CHARACTER: Character = {
  name: "",
  img: "",
  shortName: "",
  generation: 0,
  type: "",
  tier: 1,
  serious: false,
  chaos: false,
  musicEnjoyer: false,
  moe: 1,
  emotion: "",
  pronouns: "",
  link: "",
  interests: "",
  peeves: "",
  purpose: "",
  funFact: "",
  description: "",
  retirementReason: "",
  inactiveReason: "",
  alternatives: ""
};

@Component({
  selector: 'app-character-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './character-modal.html',
  styleUrl: './character-modal.scss'
})
export class CharacterModal {
  @Input() character: Character = FALLBACK_CHARACTER;
  @Output() close = new EventEmitter<void>();

  chatLink: string = '';


  loadChatLink() {
    const key = this.getChatLinkKey();
    const stored = localStorage.getItem(key);
    if (stored) {
      this.chatLink = stored;
    } else {
      this.chatLink = this.character.link;
    }
  }

  updateChatLink() {
    const newLink = prompt('Enter new chat link:', this.chatLink);
    console.log('New link entered:', newLink);
    if (newLink) {
      this.chatLink = newLink.trim() || this.character.link;
      localStorage.setItem(this.getChatLinkKey(), this.chatLink);
      alert('Chat link updated!');
    } else if (newLink === '') {
      // If the user clears the input, reset to default link
      this.chatLink = this.character.link;
      localStorage.removeItem(this.getChatLinkKey());
      alert('Chat link reset to default.');
    }
  }

  getChatLinkKey(): string {
    // Use character name or id for uniqueness
    return 'chatLink_' + (this.character.name || 'unknown');
  }

  scheduleDailyCleanup() {
    // Check if cleanup has already run today
    const lastCleanup = localStorage.getItem('chatLinkCleanup');
    const now = new Date();
    const today5am = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 5, 0, 0, 0);
    if (now > today5am && (!lastCleanup || new Date(lastCleanup) < today5am)) {
      this.cleanupChatLinks();
      localStorage.setItem('chatLinkCleanup', now.toISOString());
    }
    // Set timer for next 5:00 AM
    let next5am = new Date(today5am.getTime());
    if (now > today5am) {
      next5am.setDate(next5am.getDate() + 1);
    }
    const msUntilNext5am = next5am.getTime() - now.getTime();
    setTimeout(() => {
      this.cleanupChatLinks();
      localStorage.setItem('chatLinkCleanup', new Date().toISOString());
      this.scheduleDailyCleanup();
    }, msUntilNext5am);
  }

  cleanupChatLinks() {
    // Remove all chatLink_* keys
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('chatLink_')) {
        localStorage.removeItem(key);
      }
    });
  }


  ngOnInit() {
    document.addEventListener('mousedown', this.handleClickOutside);
    this.loadChatLink();
    this.scheduleDailyCleanup();
  }

  ngOnDestroy() {
    document.removeEventListener('mousedown', this.handleClickOutside);
  }

  handleClickOutside = (event: MouseEvent) => {
    const modal = document.getElementById('characterModal');
    if (modal && !modal.contains(event.target as Node)) {
      this.close.emit();
    }
  };

  get displayedCharacter(): Character {
    return this.character ?? FALLBACK_CHARACTER;
  }

  assetPath(path: string) {
    return 'assets/' + path;
  }

  isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.userAgent.includes('Macintosh') && 'ontouchend' in document);
  }

  async screenshot(_: string) {
    const c = this.displayedCharacter ?? this.character;
    const name = c?.name || 'Unknown Character';

    // --- STEP 1: collect CSS from modal DOM ---
    const modalEl = document.getElementById('characterModal') as HTMLElement | null;
    const nameEl  = document.getElementById('modalName') as HTMLElement | null;

    // Avatar elements
    const imgEl = modalEl?.querySelector('.modalImg') as HTMLImageElement | null;
    const qmEl  = document.getElementById('modalQuestionMark') as HTMLElement | null;

    // Pick a style source (image if present, otherwise the '?' block)
    const avatarRef = imgEl ?? qmEl;
    const avatarCS  = avatarRef ? getComputedStyle(avatarRef) : null;

    // Dimensions / radius from CSS (fallbacks if missing)
    const AVATAR_SIZE   = Math.round(parseFloat(avatarCS?.width || '160')) || 160;
    const AVATAR_RADIUS = Math.round(parseFloat(avatarCS?.borderRadius || '16')) || 16;

    // Gap between avatar and text column
    const AVATAR_GAP = 16;

    const modalCS = modalEl ? getComputedStyle(modalEl) : null;
    const nameCS  = nameEl  ? getComputedStyle(nameEl)  : null;

    const flagsEl = modalEl?.querySelector('.flags') as HTMLElement | null;
    const flagsCS = flagsEl ? getComputedStyle(flagsEl) : null;


    const FLAGS_TEXT  = flagsEl?.innerText?.trim() || ''; // e.g. "🤔  🤪  😀"
    const FLAGS_COLOR = flagsCS?.color || '#c3c8d4';
    const FLAGS_FONT  = [
      flagsCS?.fontWeight || '400',
      flagsCS?.fontSize   || '22px',
      flagsCS?.fontFamily || 'system-ui, -apple-system, Segoe UI, Inter, sans-serif'
    ].join(' ');

    // Fallback values if CSS isn’t found
    const BG         = modalCS?.backgroundColor || '#0f1115';
    const BORDER     = modalCS?.borderColor     || '#23262d';
    const BORDER_W   = parseFloat(modalCS?.borderWidth || '2') || 2;
    const RADIUS     = parseFloat(modalCS?.borderTopLeftRadius || '16') || 16;

    const TITLE_COLOR = nameCS?.color || '#e6e9ef';
    const TITLE_FONT  = [
      nameCS?.fontWeight || '700',
      nameCS?.fontSize   || '32px',
      nameCS?.fontFamily || 'system-ui, -apple-system, Segoe UI, Inter, sans-serif'
    ].join(' ');

    const titleSize = parseFloat((nameCS?.fontSize || '32px'));
    const flagsSize = FLAGS_TEXT ? parseFloat((flagsCS?.fontSize || '22px')) : 0;

    const retiredBannerEl = modalEl?.querySelector('.retired-banner') as HTMLElement | null;

    const retiredBannerCS = retiredBannerEl ? getComputedStyle(retiredBannerEl) : null;

    const RETIRED_TEXT  = retiredBannerEl?.innerText || '';   // usually "Retired"
    const RETIRED_COLOR = retiredBannerCS?.color     || '#fff';
    const RETIRED_FONT  = [
      retiredBannerCS?.fontWeight || '700',
      retiredBannerCS?.fontSize   || '20px',
      retiredBannerCS?.fontFamily || 'system-ui, sans-serif'
    ].join(' ');

    function wrapText(
      ctx: CanvasRenderingContext2D,
      text: string,
      maxWidth: number
    ): string[] {
      if (!text) return [''];
      // Normalize whitespace + preserve manual newlines
      const paragraphs = String(text).replace(/\s+/g, ' ').split(/\n/);
      const lines: string[] = [];

      for (const para of paragraphs) {
        const words = para.split(' ');
        let cur = '';

        for (const w of words) {
          const test = cur ? cur + ' ' + w : w;
          if (ctx.measureText(test).width <= maxWidth) {
            cur = test;
          } else {
            if (!cur) {
              // word longer than maxWidth; hard-break
              let chunk = '';
              for (const ch of w) {
                const test2 = chunk + ch;
                if (ctx.measureText(test2).width <= maxWidth) {
                  chunk = test2;
                } else {
                  if (chunk) lines.push(chunk);
                  chunk = ch;
                }
              }
              if (chunk) cur = chunk; // start next line with leftover
            } else {
              lines.push(cur);
              cur = w;
            }
          }
        }
        if (cur) lines.push(cur);
      }
      return lines.length ? lines : [''];
    }

    // --- BODY ROWS: Interests / Peeves / Best For / Fun Fact ---
    function grabRow(id: string) {
      const el = document.getElementById(id) as HTMLElement | null;
      if (!el) return null;
      const strong = el.querySelector('strong') as HTMLElement | null;

      const full = (el.innerText || '').trim();               // e.g. "Interests: Reading, ..."
      const labelText = (strong?.innerText || '').replace(':', '').trim(); // "Interests"
      const valueText = full.replace(/^.*?:\s*/, '');         // strip leading "Label: "
      const rowCS = getComputedStyle(el);
      const labelCS = strong ? getComputedStyle(strong) : rowCS;

      return {
        label: labelText,
        value: valueText,
        color: rowCS.color || '#e6e9ef',
        labelColor: labelCS.color || rowCS.color || '#e6e9ef',
        labelFont: [
          labelCS.fontWeight || '600',
          labelCS.fontSize   || '16px',
          labelCS.fontFamily || 'system-ui, -apple-system, Segoe UI, Inter, sans-serif'
        ].join(' '),
        valueFont: [
          rowCS.fontWeight || '400',
          rowCS.fontSize   || '16px',
          rowCS.fontFamily || 'system-ui, -apple-system, Segoe UI, Inter, sans-serif'
        ].join(' ')
      };
    }

    const rows = [
      grabRow('modalInterests'),
      grabRow('modalPeeves'),
      grabRow('modalPurpose'),
      grabRow('modalFact'),
      grabRow('modalRetirement'),
      grabRow('modalInactive'),
      grabRow('modalAlternatives'),
    ].filter(Boolean) as Array<ReturnType<typeof grabRow>>;

    async function loadImageSafe(src?: string): Promise<HTMLImageElement | undefined> {
      if (!src) return undefined;
      try {
        // handle data: URLs or same-origin fast path
        if (src.startsWith('data:') || src.startsWith(location.origin)) {
          return await new Promise((res, rej) => {
            const img = new Image();
            img.onload = () => res(img);
            img.onerror = rej;
            img.src = src;
          });
        }
        // cross-origin: fetch -> blob -> objectURL to keep canvas untainted
        const resp = await fetch(src, { mode: 'cors' });
        const blob = await resp.blob();
        return await new Promise((res, rej) => {
          const url = URL.createObjectURL(blob);
          const img = new Image();
          img.onload = () => { URL.revokeObjectURL(url); res(img); };
          img.onerror = rej;
          img.src = url;
        });
      } catch {
        return undefined;
      }
    }

    // Prefer the img in the modal if present, else your character data (assetPath/relative)
    const avatarSrc =
      imgEl?.src ??
      (this.character?.img ? this.assetPath(this.character.img) : undefined);

    const avatarImg = await loadImageSafe(avatarSrc);

    // --- STEP 2: setup canvas ---
    const W = Math.max(600, Math.ceil(modalEl?.clientWidth || 800));
    const P = 24;
    // text column starts to the right of the avatar
    const textX = P + AVATAR_SIZE + AVATAR_GAP;
    // body rows: label (bold) + value (regular), same line
    const labelGap = 8;
    // available width for text/wrapping
    const contentWidth = W - textX - P;
    // top padding + title + gap + flags (if any) + bottom padding
    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));

    // We need a throwaway canvas/ctx to measure with row fonts before real canvas exists
    const measCanvas = document.createElement('canvas');
    const measCtx = measCanvas.getContext('2d')!;

    let bodyHeight = 0;
    const preparedRows = rows.map(r => {
      if (!r) return null;

      // measure label width using label font
      measCtx.font = r.labelFont;
      const label = r.label ? (r.label + ':') : '';
      const labelWidth = label ? measCtx.measureText(label).width : 0;

      // wrap value using value font
      measCtx.font = r.valueFont;
      const maxValueWidth = Math.max(60, contentWidth - (label ? labelWidth + labelGap : 0));
      const valueLines = wrapText(measCtx, r.value || '', maxValueWidth);
      const lineHeight = parseFloat((r.valueFont.split(' ')[1] || '16px'));
      const height = valueLines.length * lineHeight + 6;

      bodyHeight += height;
      return { ...r, label, labelWidth, valueLines, lineHeight };
    });

    // text block height (title + gap + flags + gap + rows)
    const textBlockHeight = Math.ceil(
      titleSize + 12 + (FLAGS_TEXT ? flagsSize + 8 : 0) + bodyHeight
    );

    // final canvas height must fit both avatar and text
    const H = Math.max(P + AVATAR_SIZE + P, P + textBlockHeight + P);

    const canvas = document.createElement('canvas');
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    // --- STEP 3: use CSS values when drawing ---
    // helper
    const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
      const rr = Math.min(r, w/2, h/2);
      ctx.beginPath();
      ctx.moveTo(x + rr, y);
      ctx.arcTo(x + w, y, x + w, y + h, rr);
      ctx.arcTo(x + w, y + h, x, y + h, rr);
      ctx.arcTo(x, y + h, x, y, rr);
      ctx.arcTo(x, y, x + w, y, rr);
      ctx.closePath();
    };

    // background + border
    ctx.fillStyle = BG;
    roundRect(0, 0, W, H, RADIUS);
    ctx.fill();

    ctx.strokeStyle = BORDER;
    ctx.lineWidth = BORDER_W;
    roundRect(0.5, 0.5, W - 1, H - 1, RADIUS);
    ctx.stroke();

    const ax = P, ay = P, a = AVATAR_SIZE;
    // rounded-rect clip
    ctx.save();
    ctx.beginPath();
    const r = Math.min(AVATAR_RADIUS, a / 2);
    ctx.moveTo(ax + r, ay);
    ctx.arcTo(ax + a, ay, ax + a, ay + a, r);
    ctx.arcTo(ax + a, ay + a, ax, ay + a, r);
    ctx.arcTo(ax, ay + a, ax, ay, r);
    ctx.arcTo(ax, ay, ax + a, ay, r);
    ctx.closePath();
    ctx.clip();

    // draw image or placeholder
    if (avatarImg) {
      ctx.drawImage(avatarImg, ax, ay, a, a);
    } else {
      // match your '?' block colors if you want; simple fallback:
      ctx.fillStyle = '#1c2030';
      ctx.fillRect(ax, ay, a, a);
      ctx.fillStyle = '#8ea0ff';
      ctx.font = '900 ' + Math.round(a * 0.5) + 'px ' + (nameCS?.fontFamily || 'system-ui, -apple-system, Segoe UI, Inter, sans-serif');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', ax + a / 2, ay + a / 2);
    }
    ctx.restore();

    let y = P;

    // title
    ctx.fillStyle = TITLE_COLOR;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.font = TITLE_FONT;
    ctx.fillText(name, textX, y);
    y += titleSize + 12;

    // retired text
    if (RETIRED_TEXT) {
      ctx.textAlign = 'right';

      // Banner (e.g. "Retired")
      ctx.fillStyle = RETIRED_COLOR;
      ctx.font = RETIRED_FONT;
      ctx.fillText(RETIRED_TEXT, W - P, P);

      ctx.textAlign = 'left'; // reset for the rest
    }

    // flags
    if (FLAGS_TEXT) {
      ctx.fillStyle = FLAGS_COLOR;
      ctx.font = FLAGS_FONT;
      ctx.fillText(FLAGS_TEXT, textX, y);
      y += flagsSize + 8;
    }

    for (const r of preparedRows) {
      if (!r) continue;
      // label
      ctx.fillStyle = r.labelColor;
      ctx.font = r.labelFont;
      ctx.fillText(r.label, textX, y);

      // value
      ctx.fillStyle = r.color;
      ctx.font = r.valueFont;
      const startX = textX + (r.label ? r.labelWidth + labelGap : 0);
      for (let i = 0; i < r.valueLines.length; i++) {
        ctx.fillText(r.valueLines[i], startX, y);
        y += r.lineHeight;
      }
      y += 6;
    }

    // --- STEP 4: export as before ---
    const blob: Blob = await new Promise(res => canvas.toBlob(b => res(b!), 'image/png', 1));
    try {
      await navigator.clipboard.write([
        new (window as any).ClipboardItem({ 'image/png': blob })
      ]);
      alert('Card copied to clipboard.');
    } catch {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (c?.shortName || name) + '.png';
      a.click();
      URL.revokeObjectURL(url);
    }
  }
}