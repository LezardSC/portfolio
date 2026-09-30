import type { Education, Hackathon, Job } from '$lib/experience';

/** Work experience. Order here doesn't matter: the page sorts newest first. */
export const JOBS: Job[] = [
	{
		company: 'Sogeti, part of Capgemini',
		role: {
			en: 'Machine Learning & Computer Vision developer',
			fr: 'Développeur Machine Learning & IA Vision'
		},
		start: '2025-07',
		end: '2026-01',
		internship: true,
		points: [
			{
				en: 'Built an automated experimentation workflow that improved a computer-vision model detecting and classifying underwater and satellite images, from training to evaluation.',
				fr: 'Mise en place d’un workflow d’automatisation d’expérimentations qui a amélioré un modèle d’IA de vision détectant et classifiant des images sous-marines et satellites, de l’entraînement à l’évaluation.'
			},
			{ en: 'Wrote a scientific paper.', fr: 'Rédaction d’un article scientifique.' }
		],
		tech: ['PyTorch', 'Python', 'Computer Vision', 'Bash'],
		quote: {
			text: {
				en: 'A very good collaborator, serious and committed. He has a solid grasp of Machine Learning and proposes relevant solutions while staying pragmatic.',
				fr: 'Très bon collaborateur, sérieux et impliqué. Il maîtrise bien les sujets de Machine Learning et sait proposer des solutions pertinentes tout en restant pragmatique.'
			},
			author: 'Herve Nikue',
			role: {
				en: 'R&D Project Manager, Sogeti (internship tutor)',
				fr: 'Chef de projet R&D, Sogeti (tuteur de stage)'
			},
			original: 'fr'
		}
	},
	{
		company: 'Y247 Group',
		role: { en: 'Full Stack developer', fr: 'Développeur Full Stack' },
		start: '2024-10',
		end: '2025-04',
		internship: true,
		points: [
			{
				en: 'Designed and built a web application for a private-sector client, from scratch.',
				fr: 'Conception et développement d’une application web pour un client du secteur privé, en partant de zéro.'
			},
			{
				en: 'Set up the dev environment, designed the database, and built the backend, API routes and authentication.',
				fr: 'Mise en place de l’environnement de développement, architecture de la base de données, développement du backend, des routes API et de l’authentification.'
			},
			{
				en: 'Built the frontend, integrating mock-ups from a designer.',
				fr: 'Développement du frontend avec intégration de maquettes fournies par un designer.'
			}
		],
		tech: ['SvelteKit', 'Node.js', 'Express'],
		quote: {
			text: {
				en: 'He took a full part in developing our platform, on both front-end and back-end. He proved serious, autonomous and committed, quick to grasp technical problems and propose suitable solutions.',
				fr: 'Il a pleinement participé au développement de notre plateforme, aussi bien sur les sujets front-end que back-end. Il s’est montré sérieux, autonome et impliqué, avec une bonne capacité à comprendre rapidement les problématiques techniques et à proposer des solutions adaptées.'
			},
			author: 'Vincent Tamme',
			role: { en: 'President, Y247 Group', fr: 'Président, Y247 Group' },
			original: 'fr'
		}
	}
];

/** Education. Order here doesn't matter: the page sorts newest first. */
export const EDUCATION: Education[] = [
	{
		school: '42 Lyon',
		title: { en: 'Expert in computer architecture', fr: 'Expert en architecture informatique' },
		start: '2022',
		end: '2026',
		points: [
			{
				en: 'RNCP 7: information systems & networks',
				fr: 'RNCP 7 : systèmes d’information et réseaux'
			},
			{
				en: 'RNCP 6: software solutions designer-developer, web & mobile',
				fr: 'RNCP 6 : concepteur développeur de solutions informatiques, web et mobile'
			}
		]
	},
	{
		school: 'Harvard',
		title: {
			en: 'CS50’s Introduction to Computer Science',
			fr: 'CS50’s Introduction to Computer Science'
		},
		end: '2024',
		points: [],
		link: 'https://certificates.cs50.io/b9c16727-3912-4e88-ac47-07ed9a982bc5.pdf?size=letter'
	}
];

/** Hackathon results. Order here doesn't matter: the page sorts newest first. */
export const HACKATHONS: Hackathon[] = [
	{ medal: 1, event: 'Paris Blockchain Week', date: '2024-04', project: 'KAYP' },
	{ medal: 1, event: 'H-W3B Paris', date: '2024-03', project: 'KAYP' },
	{ medal: 2, event: 'H-W3B Super Finale', date: '2024-11', project: 'KAYP' },
	{ medal: 3, event: 'Paris Blockchain Week', date: '2025-04', project: 'Bahapad' },
	{
		medal: 3,
		event: 'CND',
		fullName: 'Commissariat au Numérique de Défense',
		date: '2025-11',
		project: { en: 'Firewall log triage', fr: 'Tri de logs pare-feu' }
	}
];
