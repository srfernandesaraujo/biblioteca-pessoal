import { db } from '../db/database';

/**
 * Runs active automation rules against a document's title and OCR text.
 * @param {string} text - OCR text content
 * @param {string} title - Document title
 * @param {object} currentValues - { categoryId, correspondentId, docTypeId, tags }
 * @returns {Promise<{ categoryId: number|null, correspondentId: number|null, docTypeId: number|null, tags: number[], matchedRules: string[] }>}
 */
export async function runAutomationRules(text = '', title = '', currentValues = {}) {
  const rules = await db.automationRules.filter(r => r.enabled).toArray();
  const contentToSearch = `${title} \n ${text}`.toLowerCase();

  let categoryId = currentValues.categoryId || null;
  let correspondentId = currentValues.correspondentId || null;
  let docTypeId = currentValues.docTypeId || null;
  const tagsSet = new Set(currentValues.tags || []);
  const matchedRules = [];

  for (const rule of rules) {
    if (!rule.keywords || rule.keywords.length === 0) continue;

    let isMatch = false;
    if (rule.matchType === 'all') {
      isMatch = rule.keywords.every(kw => contentToSearch.includes(kw.toLowerCase()));
    } else {
      isMatch = rule.keywords.some(kw => contentToSearch.includes(kw.toLowerCase()));
    }

    if (isMatch) {
      matchedRules.push(rule.name);

      if (!categoryId && rule.assignCategory) {
        categoryId = rule.assignCategory;
      }
      if (!correspondentId && rule.assignCorrespondent) {
        correspondentId = rule.assignCorrespondent;
      }
      if (!docTypeId && rule.assignDocType) {
        docTypeId = rule.assignDocType;
      }
      if (rule.assignTags && Array.isArray(rule.assignTags)) {
        rule.assignTags.forEach(tId => tagsSet.add(tId));
      }
    }
  }

  return {
    categoryId,
    correspondentId,
    docTypeId,
    tags: Array.from(tagsSet),
    matchedRules
  };
}
