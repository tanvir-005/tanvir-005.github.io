// Seed content, taken from the previous portfolio. Edit freely; the admin panel is the source of truth afterwards.
const OLD = 'https://tanvir-005.github.io/Portfolio'

export const profile = {
  name: 'MD. Tanvir Ahmed Siddique',
  shortName: 'Tanvir Ahmed',
  headline: 'Competitive programmer, CSE graduate and ML enthusiast',
  description: 'MD. Tanvir Ahmed Siddique, CSE graduate and competitive programmer (Codeforces Specialist). Contests, projects and writing.',
  bio: 'I am a competitive programmer and CSE graduate from IUBAT. I have represented my university in 13 onsite programming contests, trained juniors in problem-solving sessions for more than two years, and volunteered as a mentor for the Data Structures and Algorithms course. I currently manage the Programming Club of the IUBAT IT Society.',
  image: `${OLD}/images/tanvir.png`,
  imageAlt: 'Portrait of MD. Tanvir Ahmed Siddique',
  institution: 'International University of Business Agriculture and Technology (IUBAT)',
  email: 'tanvir.24633@gmail.com',
  phone: '+88 01704-476935',
  github: 'https://github.com/tanvir-005',
  linkedin: 'https://www.linkedin.com/in/tanvir-ahmed-siddique-/',
  facebook: 'https://www.facebook.com/005tanvir/',
  codeforces: 'twilighTTanvir',
  footer: 'Go where the universe takes...'
}

export const cv = { url: `${OLD}/tanvir-ahmed-siddique-cv.pdf` }

const contests = [
  ['ICPC Dhaka Regional Site 2025', 'IUBAT Eksho Eksho', '62nd', 'December, 2025', 'https://bapsoj.org/contests/icpc-dhaka-onsite-2025/standings', 'ICPC_25.JPG'],
  ['ICPC 2025 Preliminary', 'IUBAT Eksho Eksho', '97th', 'November, 2025', 'https://bapsoj.org/contests/icpc-dhaka-2025-online-preliminary/standings', '', 'among 2100+ teams'],
  ['CUET Inter University Programming Contest 2025', 'IUBAT Eksho Eksho', '35th', 'November, 2025', 'https://toph.co/c/cuet-iupc-2025/standings', ''],
  ['Inter University Programming Contest - MU CSE Fest 2025', 'IUBAT Eksho Eksho', '39th', 'November, 2025', 'https://toph.co/c/inter-university-mu-cse-fest-2025/standings', ''],
  ['8th DRMC International Tech Carnival 2025 - Programming Contest - Main Round', 'Tourists', '19th', 'October, 2025', 'https://toph.co/contests/training/z9wvv8k/standings', ''],
  ['Uttara University Inter-University Programming Contest 2025', 'IUBAT_Paracetamol', '68th', 'June, 2025', 'https://toph.co/c/uttara-university-inter-university-2025/standings', 'UU_IUPC.jpeg'],
  ['Battle of Intellects - Spring 2025 - IUBAT', 'Individual', '4th', 'May, 2025', 'https://toph.co/contests/training/eq2nk3p/standings', 'BOI_IUBAT.jpg'],
  ['Betopia Group Presents DUET Inter University Programming Contest 2025', 'IUBAT_enCRYpted', '46th', 'May, 2025', 'https://toph.co/c/duet-inter-university-iupc-2025/standings', 'DUET_IUPC.jpg'],
  ['MIAKI Presents KUET IUPC 2025', 'IUBAT Eksho Eksho', '113th', 'January, 2025', 'https://bapsoj.org/contests/miaki-presents-kuet-iupc-onsite-2025/standings', 'KUET_IUPC.jpg'],
  ['ICPC Asia Dhaka Regional Contest 2024', 'IUBAT_LivingThings', '64th', 'December, 2024', 'https://bapsoj.org/contests/icpc-asia-dhaka-regional-contest-2024-onsite-round/standings', 'DIU_ICPC.jpg'],
  ['BUET CSE Fest Inter-University Programming Contest 2024', 'IUBAT_LivingThings', '52nd', 'November, 2024', 'https://toph.co/c/inter-university-buet-cse-fest-2024/standings', 'BUET_IUPC.jpg'],
  ['IUT 11th National ICT Fest IUPC 2024', 'IUBAT_eL3ctr0Ns', '29th', 'April, 2024', 'https://toph.co/c/iut-11th-national-ict-fest-2024/standings', ''],
  ['NCPC - National Collegiate Programming Contest 2023 (Hosted by JU)', 'IUBAT_Assassins', '136th', 'March, 2024', 'https://bapsoj.org/contests/ncpc-onsite-2023-hosted-by-ju/standings', 'JU_NCPC.jpg'],
  ['UAP Inter-University Collaborative Programming Contest 1.0 (Junior)', 'IUBAT_enCRYpted', '7th', 'January, 2024', 'https://toph.co/c/uap-inter-university-collaborative-1-0-junior/standings', 'UAP_Junior.jpg'],
  ['IUBAT Monthly Programming Contest (Intra-University Programming Contest)', 'Individual', '2nd', 'September, 2023', 'https://toph.co/contests/training/auynaxz/standings', 'Monthly.jpg'],
  ['Collaborative Programming Contest (IUBAT)', 'IUBAT enCRYpted', '19th', 'July, 2023', 'https://toph.co/contests/training/b3lljkz/standings', 'IUBAT_Collaborative.png'],
  ['Good Bye 2022 Programming Contest - IUBAT', 'Individual', '19th', 'November, 2022', 'https://toph.co/contests/training/7388376/standings', 'Goodbye2022.jpg']
]

export const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)

export const entries = []
const add = (type, e) => entries.push({ type, summary: '', body_md: '', image: '', date: '', published: 1, data: {}, ...e, slug: e.slug || slugify(e.title), sort: entries.filter((x) => x.type === type).length + 1 })

for (const [title, team, rank, date, link, img, note] of contests) {
  const solo = team === 'Individual'
  add('contest', {
    title, date, image: img ? `${OLD}/images/${img}` : '',
    summary: solo
      ? `Took part as an individual and finished ${rank}${note ? ' ' + note : ''} in ${title} (${date}).`
      : `Competed as team ${team} and finished ${rank}${note ? ' ' + note : ''} in ${title} (${date}).`,
    data: { team, rank, note: note || '', link, imageAlt: `Photo from ${title}` }
  })
}

add('achievement', { title: 'Codeforces Round 1017 (Div. 4)', data: { result: 'Global rank 649', link: 'https://codeforces.com/contest/2094/standings/participant/208401230#p208401230' } })
add('achievement', { title: 'Codeforces Round 1045 (Div. 2)', data: { result: 'Global rank 835', link: 'https://codeforces.com/contest/2134/standings/participant/217766374#p217766374' } })
add('achievement', { title: 'Codeforces Round 1047 (Div. 3)', data: { result: 'Global rank 839', link: 'https://codeforces.com/contest/2137/standings/participant/218402971#p218402971' } })

add('education', { title: 'BSc. in Computer Science and Engineering', date: '2022 - 2026', data: { institution: 'International University of Business Agriculture and Technology', grade: 'CGPA 3.89' } })
add('education', { title: 'Higher Secondary Certificate (HSC)', date: '2020', data: { institution: 'Gazipur Metropolitan College', grade: 'GPA 5.00' } })
add('education', { title: 'Secondary School Certificate (SSC)', date: '2017', data: { institution: 'Sharifpur Dakhil Madrasah', grade: 'GPA 5.00' } })

add('project', {
  title: 'CodeKoro', summary: 'An online code judging system built for the Software Engineering course. It lets people create programming problems and contests, solve problems in a judged environment, take part in contests, and receive verdicts on their solutions.',
  data: { subtitle: 'An online code judging system', stack: ['ASP.NET MVC Core', 'C#'], github: 'https://github.com/tanvir-005/CodeKoro', live: '' }
})
add('project', {
  title: 'Linear Algebra 3x3 System Solver', summary: 'A C++ program that implements the logic of solving a system of three linear equations. It reads the system as input, then either calculates the values of the variables or determines whether the system is consistent.',
  data: { subtitle: 'Linear algebra logic in C++', stack: ['C++'], github: 'https://github.com/tanvir-005/LinearAlgebra-SystemSolve_3x3', live: '' }
})
add('project', {
  title: 'Diabetic Retinopathy Classification', summary: 'A deep learning approach to determine the severity of diabetic retinopathy from fundus images. The images are preprocessed and a DenseNet121 model is trained to classify them with 96% accuracy. OOP concepts keep the dataset and parameters easy to change.',
  data: { subtitle: 'Deep learning on fundus images', stack: ['Python', 'TensorFlow', 'DenseNet121', 'NumPy', 'Pandas', 'Scikit-Learn', 'Matplotlib', 'Kaggle'], github: 'https://github.com/tanvir-005/Diabetic-Retinopathy-Detection', live: '' }
})
add('project', {
  title: 'SpotLight', summary: 'An event management system for the Visual Programming course, built on the MVC architecture. Organizers can create and manage events, and participants can book them, with authentication and role-based activities.',
  data: { subtitle: 'Event management system', stack: ['C#', 'ASP.NET', 'HTML', 'CSS'], github: 'https://github.com/tanvir-005/SpotLight', live: '' }
})
add('project', {
  title: 'Library Management System', summary: 'A system built for the System Analysis and Design course, applying its principles. It offers librarian functionality together with admin activities.',
  data: { subtitle: 'Managing the work of a library', stack: ['HTML', 'CSS', 'PHP', 'MySQL'], github: 'https://github.com/tanvir-005/library_management', live: '' }
})

add('certificate', {
  title: 'Python with Machine Learning', date: 'November 2024 - May 2025', image: `${OLD}/images/Edge-ML-Certificate.jpg`,
  summary: 'Training on Python with machine learning, organized by the Department of Computer Science and Engineering (CSE), Jagannath University under the Enhancing Digital Government and Economy (EDGE) Project of the Bangladesh Computer Council, ICT Division.',
  data: { organizer: 'Department of CSE, Jagannath University (EDGE Project, Bangladesh Computer Council)', imageAlt: 'Certificate for Python with Machine Learning' }
})
add('certificate', {
  title: 'BUBT BAPS National Programming Camp 2025', date: 'September 2025',
  summary: 'A national programming camp organized by the Bangladesh Association of Problem Setters (BAPS) in collaboration with Bangladesh University of Business and Technology (BUBT).',
  data: { organizer: 'BAPS with BUBT' }
})

add('skillgroup', { title: 'Programming languages', data: { items: ['C', 'C++', 'C#', 'Java', 'Python', 'JavaScript'] } })
add('skillgroup', { title: 'Environment and tools', data: { items: ['Windows', 'Linux', 'Git', 'GitHub', 'Visual Studio', 'LaTeX'] } })
add('skillgroup', { title: 'Frameworks', data: { items: ['ASP.NET MVC', 'Bootstrap', 'Tailwind'] } })
add('skillgroup', { title: 'Expertise', data: { items: ['Data structures and algorithms', 'Problem solving', 'OOP', 'Mathematics'] } })
add('skillgroup', { title: 'Languages', data: { items: ['English', 'Bangla'] } })

add('experience', { title: 'Manager, Programming Club', date: 'Current', summary: 'Responsible for the Programming Club of the IUBAT IT Society, Department of CSE, IUBAT.', data: { organization: 'IUBAT IT Society' } })
add('experience', { title: 'Mentor, Data Structures and Algorithms', summary: 'Volunteered as a mentor for the Data Structures and Algorithms course.', data: { organization: 'Department of CSE, IUBAT' } })
add('experience', {
  title: 'Problem-solving trainer', summary: 'Trained university juniors in problem-solving sessions for more than two years. Also contributes authored problems and curated contest material for students and club activities.',
  data: { organization: 'Department of CSE, IUBAT', link: `${OLD}/authored-problems.html` }
})

add('post', {
  title: 'Welcome to the new portfolio', date: '2026-11-11', summary: 'What this site is, how it is built, and what to expect on the blog.',
  body_md: [
    'This site replaces my earlier portfolio. It keeps the same content (contests, projects, certificates) and adds a blog.',
    '',
    '## How it is built',
    '',
    '- Pages are generated ahead of time, so they load quickly and search engines see real HTML.',
    '- Content lives in a small database and is published through an admin panel.',
    '- Posts are written in Markdown, so code blocks and images work anywhere in the text.',
    '',
    '```cpp',
    '#include <iostream>',
    'int main() {',
    '    std::cout << "hello, world\\n";',
    '}',
    '```',
    '',
    'I plan to write about contest problems, algorithms and the machine learning projects I work on.'
  ].join('\n'),
  data: { tags: ['meta'] }
})

export const content = { profile, cv, entries, stats: {}, media: {} }
