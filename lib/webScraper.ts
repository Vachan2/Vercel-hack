/**
 * Web Scraper Agent
 * Fetches live public information about a hospital using the
 * DuckDuckGo Instant Answer API (no API key required) and
 * a lightweight HTML fetch of the hospital's search result snippet.
 *
 * Returns a plain-text summary that the LLM scoring agent can use
 * as grounding context.
 */

export interface HospitalWebContext {
  hospitalName: string;
  snippet: string;       // raw text scraped from the web
  source: string;        // URL or "fallback"
  scrapedAt: string;     // ISO timestamp
}

/**
 * Fetches a short web context for a hospital using DuckDuckGo's
 * no-auth Instant Answer JSON API.
 */
export async function scrapeHospitalContext(
  hospitalName: string,
  location: string,
): Promise<HospitalWebContext> {
  const query = encodeURIComponent(`${hospitalName} ${location} ICU emergency services`);
  const url = `https://api.duckduckgo.com/?q=${query}&format=json&no_html=1&skip_disambig=1`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'ICU-Recommendation-Engine/1.0' },
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) throw new Error(`DDG API returned ${res.status}`);

    const data = await res.json();

    // DuckDuckGo returns AbstractText for well-known entities
    const abstract: string = data.AbstractText ?? '';
    const abstractSource: string = data.AbstractURL ?? '';

    // Also collect related topics snippets
    const relatedTopics: string[] = (data.RelatedTopics ?? [])
      .slice(0, 3)
      .map((t: { Text?: string }) => t.Text ?? '')
      .filter(Boolean);

    const combined = [abstract, ...relatedTopics].join(' ').trim();

    if (combined.length > 20) {
      return {
        hospitalName,
        snippet: combined.slice(0, 800),
        source: abstractSource || url,
        scrapedAt: new Date().toISOString(),
      };
    }

    // Fallback: use Bing search snippet via a simple HTML scrape
    return await scrapeBingSnippet(hospitalName, location);
  } catch {
    return fallbackContext(hospitalName, location);
  }
}

/**
 * Fallback: scrape the first result snippet from Bing search HTML.
 * Strips all HTML tags and returns plain text.
 */
async function scrapeBingSnippet(
  hospitalName: string,
  location: string,
): Promise<HospitalWebContext> {
  const query = encodeURIComponent(`${hospitalName} ${location} ICU beds emergency`);
  const url = `https://www.bing.com/search?q=${query}&count=3`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; ICU-Bot/1.0)',
        Accept: 'text/html',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) throw new Error(`Bing returned ${res.status}`);

    const html = await res.text();

    // Extract text from <p class="b_lineclamp..."> or <p> tags — simple regex strip
    const snippets = [...html.matchAll(/<p[^>]*class="b_lineclamp[^"]*"[^>]*>(.*?)<\/p>/gs)]
      .map((m) => m[1].replace(/<[^>]+>/g, '').trim())
      .filter((s) => s.length > 30)
      .slice(0, 3);

    const snippet = snippets.join(' ').slice(0, 800);

    if (snippet.length > 20) {
      return {
        hospitalName,
        snippet,
        source: url,
        scrapedAt: new Date().toISOString(),
      };
    }

    return fallbackContext(hospitalName, location);
  } catch {
    return fallbackContext(hospitalName, location);
  }
}

function fallbackContext(hospitalName: string, location: string): HospitalWebContext {
  return {
    hospitalName,
    snippet: `${hospitalName} is a hospital located in ${location}, Bangalore. It provides emergency and critical care services including ICU facilities.`,
    source: 'fallback',
    scrapedAt: new Date().toISOString(),
  };
}
