export type FieldKind = 'text' | 'tags' | 'url'
export interface Field { key: string; label: string; kind: FieldKind; placeholder?: string }
export interface TypeConfig {
  label: string
  singular: string
  markdown: boolean
  hasImage: boolean
  dateHint: string
  titleHint?: string
  fields: Field[]
}

export const ENTRY_TYPES: Record<string, TypeConfig> = {
  post: {
    label: 'Posts', singular: 'post', markdown: true, hasImage: true, dateHint: 'YYYY-MM-DD, for example 2026-11-11',
    fields: [{ key: 'tags', label: 'Tags', kind: 'tags', placeholder: 'algorithms, graphs, notes' }]
  },
  project: {
    label: 'Projects', singular: 'project', markdown: true, hasImage: true, dateHint: 'For example 2025',
    fields: [
      { key: 'subtitle', label: 'One-line description', kind: 'text' },
      { key: 'stack', label: 'Built with', kind: 'tags', placeholder: 'Python, TensorFlow' },
      { key: 'github', label: 'GitHub link', kind: 'url' },
      { key: 'live', label: 'Live demo link', kind: 'url' }
    ]
  },
  contest: {
    label: 'Contests', singular: 'contest', markdown: true, hasImage: true, dateHint: 'For example December, 2025',
    fields: [
      { key: 'team', label: 'Team (or Individual)', kind: 'text' },
      { key: 'rank', label: 'Rank', kind: 'text', placeholder: '62nd' },
      { key: 'note', label: 'Rank note', kind: 'text', placeholder: 'among 2100+ teams' },
      { key: 'link', label: 'Standings link', kind: 'url' }
    ]
  },
  certificate: {
    label: 'Certificates', singular: 'certificate', markdown: true, hasImage: true, dateHint: 'For example November 2024 - May 2025',
    fields: [{ key: 'organizer', label: 'Organizer', kind: 'text' }]
  },
  education: {
    label: 'Education', singular: 'education entry', markdown: false, hasImage: false, dateHint: 'For example 2022 - 2026',
    fields: [
      { key: 'institution', label: 'Institution', kind: 'text' },
      { key: 'grade', label: 'Grade', kind: 'text', placeholder: 'CGPA 3.89' }
    ]
  },
  experience: {
    label: 'Leadership', singular: 'role', markdown: true, hasImage: false, dateHint: 'For example 2024 - Present',
    fields: [
      { key: 'organization', label: 'Organization', kind: 'text' },
      { key: 'link', label: 'Related link', kind: 'url' }
    ]
  },
  skillgroup: {
    label: 'Skills', singular: 'skill group', markdown: false, hasImage: false, dateHint: '',
    fields: [{ key: 'items', label: 'Skills in this group', kind: 'tags', placeholder: 'C++, Python, Java' }]
  },
  achievement: {
    label: 'Achievements', singular: 'achievement', markdown: false, hasImage: false, dateHint: '',
    fields: [
      { key: 'result', label: 'Result', kind: 'text', placeholder: 'Global rank 649' },
      { key: 'link', label: 'Link', kind: 'url' }
    ]
  }
}
