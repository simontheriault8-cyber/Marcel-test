import { Injectable, signal, WritableSignal } from "@angular/core";
import {
  JOBS_DATA,
  JobEntry,
  JobCategory,
  MilitaryElement,
  JOB_ELEMENTS_MAP,
  REGULAR_FORCE_NCM_PROGRAMS,
  REGULAR_FORCE_OFFICER_PROGRAMS,
  ALL_ENROLLMENT_PROGRAMS,
  ENTRY_PROGRAMS_DATABASE,
  EntryProgramsDatabase,
  RecruitmentCenter,
  RECRUITMENT_CENTERS,
} from "./jobs-data";
import SIP_DATA from "../../SIP.json";

@Injectable({
  providedIn: "root",
})
export class JobDatabaseService {
  // Recruitment centers in Quebec
  readonly RECRUITMENT_CENTERS: RecruitmentCenter[] = RECRUITMENT_CENTERS;
  // Set of Officer Jobs
  readonly OFFICER_JOBS = new Set([
    "00178", "00179", "00180", "00181", "00182", "00183", "00184", "00185",
    "00187", "00189", "00190", "00191", "00194", "00195", "00196", "00201",
    "00204", "00207", "00213", "00225", "00227", "00228", "00234", "00282",
    "00328", "00340", "00341", "00344", "00345", "00346", "00348", "00349",
    "00350", "00353", "00355", "00357", "00358", "00360", "00373", "00377",
    "00379", "00388", "00197", "00198", "00203", "00208", "00211", "00374", 
    "00389", "00390", "00393", "00398", "00214"
  ]);

  // Database of regular force entry programs
  readonly entryProgramsDatabase: EntryProgramsDatabase = ENTRY_PROGRAMS_DATABASE;
  readonly REGULAR_FORCE_NCM_PROGRAMS = REGULAR_FORCE_NCM_PROGRAMS;
  readonly REGULAR_FORCE_OFFICER_PROGRAMS = REGULAR_FORCE_OFFICER_PROGRAMS;
  readonly ALL_ENROLLMENT_PROGRAMS = ALL_ENROLLMENT_PROGRAMS;

  // Elements map
  readonly JOB_ELEMENTS_MAP = JOB_ELEMENTS_MAP;

  private jobs: JobEntry[] = [...JOBS_DATA]
    .map((job) => {
      const isOff = this.OFFICER_JOBS.has(job.id);
      const category: JobCategory = isOff ? 'officier' : 'mr';
      const element = JOB_ELEMENTS_MAP[job.id] || undefined;
      const isCMP = element === 'CMP';
      return {
        ...job,
        category,
        element,
        isCMP,
        entryPrograms: isOff ? REGULAR_FORCE_OFFICER_PROGRAMS : REGULAR_FORCE_NCM_PROGRAMS,
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));

  // Signal for active SIP phase ('admission' for normal reorientations, 'traitement' for processing reorientations, 'both' for admission & traitement)
  sipPhase = signal<'admission' | 'traitement' | 'both'>('admission');

  // Signal for sip programs status
  sipStatus: WritableSignal<Record<string, Record<string, any>>> = signal(
    (SIP_DATA as any).programs || {}
  );

  // Date when SIP was last updated
  sipDate = signal<string>(SIP_DATA.date || "");

  // Signal for jobs in gestion des attentes from SIP.json
  gestionDesAttentes: WritableSignal<string[]> = signal(
    (
      (SIP_DATA as any).gestionDesAttentes ||
      (SIP_DATA as any).gestion_des_attentes ||
      (SIP_DATA as any)["gestion des attentes"] ||
      []
    ).map((id: any) => String(id).trim().padStart(5, "0"))
  );

  isJobInGestionDesAttentes(jobId: string): boolean {
    if (!jobId) return false;
    const padded = jobId.trim().padStart(5, "0");
    return this.gestionDesAttentes().includes(padded);
  }

  getJobPforStatus(jobId: string): { admission: "o" | "f"; traitement: "o" | "f" } | null {
    const padded = jobId.trim().padStart(5, "0");
    const raw = this.sipStatus()[padded] || {};
    const pfor = raw["PFOR"];
    if (!pfor) return null;
    if (typeof pfor === "string") {
      return { admission: pfor as any, traitement: pfor as any };
    }
    return {
      admission: pfor.admission || "o",
      traitement: pfor.traitement || "o",
    };
  }

  isOfficerJob(jobId: string): boolean {
    return this.OFFICER_JOBS.has(jobId);
  }

  getJobById(jobId: string): JobEntry | undefined {
    const paddedId = jobId.padStart(5, "0");
    return this.jobs.find(j => j.id === paddedId);
  }

  getJobElement(jobId: string): MilitaryElement | null {
    const padded = jobId.padStart(5, '0');
    return JOB_ELEMENTS_MAP[padded] || null;
  }

  isCMPJob(jobId: string): boolean {
    return this.getJobElement(jobId) === 'CMP';
  }

  detectJobElement(jobQueryOrId: string): MilitaryElement | null {
    if (!jobQueryOrId || !jobQueryOrId.trim()) return null;
    const trimmed = jobQueryOrId.trim();

    // 1. Check if contains job ID (3 to 5 digits)
    const match = trimmed.match(/\b(\d{3,5})\b/);
    if (match) {
      const paddedId = match[1].padStart(5, '0');
      const elem = this.getJobElement(paddedId);
      if (elem) return elem;
    }

    // 2. Exact or partial match on job title or abbreviation
    const lower = trimmed.toLowerCase();
    const foundJob = this.jobs.find((j) =>
      j.title.toLowerCase() === lower ||
      j.abbreviation.toLowerCase() === lower ||
      `${j.id} - ${j.title}`.toLowerCase() === lower ||
      lower.includes(j.title.toLowerCase())
    );
    if (foundJob && foundJob.element) {
      return foundJob.element;
    }

    return null;
  }

  getJobCategory(jobId: string): JobCategory {
    return this.isOfficerJob(jobId) ? 'officier' : 'mr';
  }

  getProgramsForJobType(jobCategory: JobCategory | null): string[] {
    if (jobCategory === 'officier') {
      return this.REGULAR_FORCE_OFFICER_PROGRAMS;
    }
    if (jobCategory === 'mr') {
      return this.REGULAR_FORCE_NCM_PROGRAMS;
    }
    return this.ALL_ENROLLMENT_PROGRAMS;
  }

  detectJobType(jobQueryOrId: string): JobCategory | null {
    if (!jobQueryOrId || !jobQueryOrId.trim()) return null;
    const trimmed = jobQueryOrId.trim();

    // 1. Check if contains job ID (3 to 5 digits)
    const match = trimmed.match(/\b(\d{3,5})\b/);
    if (match) {
      const paddedId = match[1].padStart(5, '0');
      const job = this.jobs.find((j) => j.id === paddedId);
      if (job) {
        return this.isOfficerJob(job.id) ? 'officier' : 'mr';
      }
    }

    // 2. Exact or partial match on job title or abbreviation
    const lower = trimmed.toLowerCase();
    const foundJob = this.jobs.find((j) =>
      j.title.toLowerCase() === lower ||
      j.abbreviation.toLowerCase() === lower ||
      `${j.id} - ${j.title}`.toLowerCase() === lower ||
      lower.includes(j.title.toLowerCase())
    );
    if (foundJob) {
      return this.isOfficerJob(foundJob.id) ? 'officier' : 'mr';
    }

    // 3. Heuristics based on keywords
    if (lower.includes('officier') || lower.includes('offr')) {
      return 'officier';
    }
    if (lower.includes('militaire du rang') || lower.includes('mr') || lower.includes('ncm')) {
      return 'mr';
    }

    return null;
  }

  getProgramsForJob(jobQueryOrId: string): string[] {
    const jobType = this.detectJobType(jobQueryOrId);
    return this.getProgramsForJobType(jobType);
  }

  readonly RP_JOBS = new Set([
    // Métiers du rang (Rank)
    "00005",
    "00010",
    "00019",
    "00100",
    "00105",
    "00129",
    "00130",
    "00134",
    "00135",
    "00136",
    "00137",
    "00138",
    "00149",
    "00152",
    "00153",
    "00155",
    "00161",
    "00164",
    "00166",
    "00167",
    "00168",
    "00169",
    "00170",
    "00171",
    "00261",
    "00301",
    "00302",
    "00303",
    "00304",
    "00305",
    "00306",
    "00327",
    "00335",
    "00337",
    "00339",
    "00368",
    "00370",
    "00372",
    "00375",
    "00376",
    "00386",
    "00387",
    "00402",
    "00404",
    "00405",
    "00406",
    "00407",
    // Officiers (Officers)
    "00178",
    "00179",
    "00180",
    "00181",
    "00182",
    "00183",
    "00184",
    "00185",
    "00187",
    "00189",
    "00190",
    "00191",
    "00194",
    "00195",
    "00197",
    "00198",
    "00203",
    "00208",
    "00211",
    "00328",
    "00345",
    "00349",
    "00374",
    "00389",
    "00390",
    "00393",
    "00398",
  ]);

  // Set of Canadian Citizen (CC) only jobs as per the PDF logic
  readonly CC_JOBS = new Set([
    // Métiers du rang (Rank)
    "00099",
    "00109",
    "00114",
    "00115",
    "00120",
    "00238",
    "00299",
    "00324",
    "00366",
    "00378",
    "00383",
    "00384",
    "00385",
    // Officiers (Officers)
    "00204",
    "00207",
    "00213",
    "00214",
    "00340",
    "00341",
    "00344",
  ]);

  constructor() {}

  isJobRp(jobId: string): boolean {
    return this.RP_JOBS.has(jobId);
  }

  getJobStatusTags(jobId: string): ("CC" | "RP")[] {
    if (this.RP_JOBS.has(jobId)) {
      return ["CC", "RP"];
    } else {
      return ["CC"];
    }
  }

  getJobPrograms(jobId: string, phase?: 'admission' | 'traitement' | 'both'): Record<string, string> {
    const raw = this.sipStatus()[jobId] || {};
    const targetPhase = phase || this.sipPhase();
    const result: Record<string, string> = {};
    for (const [prog, val] of Object.entries(raw)) {
      if (typeof val === 'string') {
        result[prog] = val;
      } else if (val && typeof val === 'object') {
        if (targetPhase === 'both') {
          const adm = (val as any)['admission'];
          const trt = (val as any)['traitement'];
          if (adm === 'o' || trt === 'o') {
            result[prog] = 'o';
          } else if (adm === 'f' && trt === 'f') {
            result[prog] = 'f';
          } else {
            result[prog] = trt || adm || 'o';
          }
        } else {
          result[prog] = (val as any)[targetPhase] || (val as any)['admission'] || 'o';
        }
      }
    }
    return result;
  }

  isJobClosed(jobId: string, phase?: 'admission' | 'traitement' | 'both'): boolean {
    const jobPrograms = this.getJobPrograms(jobId, phase);
    if (!jobPrograms || Object.keys(jobPrograms).length === 0) return false;

    if (this.isOfficerJob(jobId)) {
      if (jobPrograms['EDO'] === 'f') return true;
      // If EDO is missing but there are other programs, assume open if not explicitly 'f'
      // Based on instructions, we only check EDO
    } else {
      if (jobPrograms['Non Qual'] === 'f') return true;
      // Some jobs like 00003 have "aucun" instead of "Non Qual"
      if (jobPrograms['aucun'] === 'f') return true;
    }

    return false;
  }

  isPforJobClosed(jobId: string, phase?: 'admission' | 'traitement' | 'both'): boolean {
    const jobPrograms = this.getJobPrograms(jobId, phase);
    if (!jobPrograms || !jobPrograms['PFOR']) return true;
    return jobPrograms['PFOR'] === 'f';
  }

  hasPforProgram(jobId: string, phase?: 'admission' | 'traitement' | 'both'): boolean {
    const jobPrograms = this.getJobPrograms(jobId, phase);
    return !!(jobPrograms && jobPrograms['PFOR']);
  }

  isPforJob(jobIdOrEntry: string | JobEntry, phase?: 'admission' | 'traitement' | 'both'): boolean {
    const job = typeof jobIdOrEntry === 'string' ? this.getJobById(jobIdOrEntry) : jobIdOrEntry;
    if (!job) return false;
    if (this.hasPforProgram(job.id, phase)) return true;
    if (job.contracts && job.contracts.some(c => (c.program || '').toUpperCase() === 'PFOR')) return true;
    return false;
  }

  searchJobs(query: string): JobEntry[] {
    if (!query || query.trim() === "") {
      return this.jobs;
    }

    let searchString = query.toLowerCase().trim();
    let mathResolvedId: string | null = null;

    // Check if the query is a mathematical expression (only digits, operators, spaces)
    if (/^[\d\s+\-*/()]+$/.test(searchString)) {
      try {
        // Safe evaluation
        const result = new Function(`return ${searchString}`)();
        if (
          typeof result === "number" &&
          Number.isFinite(result) &&
          result >= 0
        ) {
          mathResolvedId = result.toString().padStart(5, "0");
        }
      } catch (e) {
        // Ignore math evaluation errors
      }
    }

    // Split query into terms
    let searchTerms = searchString.split(/\s+/);

    // Aliases mapping for common specific requests
    const aliases: { [key: string]: string[] } = {
      "officier des transmissions": ["transmissions"],
      "officier de la logistique": ["logistique"],
      "officier blindé": ["blindés", "blindes"],
      "officier d'infanterie": ["infanterie"],
      "officier du génie": ["génie", "genie"],
    };

    for (const [key, mapping] of Object.entries(aliases)) {
      if (searchString.includes(key)) {
        searchTerms.push(...mapping);
      }
    }

    // Ignore common words to loosen the search, including 'officier' to prevent it from filtering out jobs without 'officier' in the title
    const ignoreWords = new Set([
      "des",
      "de",
      "la",
      "le",
      "les",
      "d",
      "l",
      "un",
      "une",
      "et",
      "en",
      "officier",
      "d'",
    ]);
    const significantTerms = searchTerms.filter((t) => !ignoreWords.has(t));

    // Fallback if all terms were ignored
    const finalTerms =
      significantTerms.length > 0 ? significantTerms : searchTerms;

    return this.jobs.filter((job) => {
      // 1. Math exact match
      if (mathResolvedId && job.id === mathResolvedId) {
        return true;
      }

      // 2. Term-based matching
      const jobTextStrict =
        `${job.id} ${job.title} ${job.abbreviation}`.toLowerCase();
      const jobTextLoose =
        `${job.id} ${job.title} ${job.abbreviation} ${job.requirements}`.toLowerCase();

      // We want to make sure EVERY significant term is present in the jobText
      // Except for the math exact expression itself which won't be in the text like "5+5",
      // but if we had mathResolvedId, it would have returned true above unless it was a partial match.
      // If it's a math expression and we didn't return true, let's just make it check if the expression string is in the text (e.g. maybe literally "10").

      // Remove the raw math expression from terms if it was resolved to avoid failing the text search
      const termsToCheck = finalTerms.filter(
        (term) => !/^[\d\s+\-*/()]+$/.test(term) || !mathResolvedId,
      );

      if (termsToCheck.length === 0 && mathResolvedId) {
        // It was purely a math expression, and it didn't match the exact ID above.
        // Maybe it matches partially?
        return (
          job.id.includes(mathResolvedId.replace(/^0+/, "")) ||
          jobTextStrict.includes(Number(mathResolvedId).toString())
        );
      }

      // Instead of failing strict, require it in strict unless they type a really weird word.
      // Easiest fix for "trop permissive" is to just use jobTextStrict
      return termsToCheck.every((term) => jobTextStrict.includes(term));
    });
  }

  getAllJobs(): JobEntry[] {
    return this.jobs;
  }
}
