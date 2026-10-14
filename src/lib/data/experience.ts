import type { Education, Hackathon, Job } from '$lib/experience';
import { typeset } from '$lib/i18n/typography';

// French text may use plain spaces and straight apostrophes: typeset() adds the no-break spaces and ’
// (docs/content-guide.md). Always give typeset its type, typeset<X[]>(…): it keeps TypeScript's check
// of misspelled field names.

/** Work experience. Order here doesn't matter: the page sorts newest first. */
export const JOBS = typeset<Job[]>([
	{
		company: 'Sogeti, part of Capgemini',
		role: {
			en: 'Machine Learning R&D Engineer',
			fr: 'Ingénieur R&D Machine Learning'
		},
		roleShort: { en: 'ML R&D Engineer', fr: 'Ingénieur R&D ML' },
		companyShort: 'Sogeti (Capgemini)',
		start: '2025-07',
		end: '2026-01',
		internship: true,
		points: [
			{
				en: 'Built an automated pipeline to test data augmentations for a marine-animal detector (Faster R-CNN): training, evaluation and results tracking, on a remote GPU server.',
				fr: 'Mise en place d’un pipeline automatisé de test d’augmentations de données pour un détecteur d’animaux marins (Faster R-CNN) : entraînement, évaluation et suivi des résultats, sur un serveur GPU distant.'
			},
			{
				en: 'These experiments led to a method that raised the aerial-image recall of a model trained on underwater images from 5.4% to 58.3%, without retraining.',
				fr: 'Ces expériences ont abouti à une méthode qui fait passer de 5,4 % à 58,3 % le rappel sur images aériennes d’un modèle entraîné sur images sous-marines, sans réentraînement.'
			},
			{
				en: 'Co-authored a paper accepted at IEEE ICIP 2026: “Improving Cross-Domain Marine Animal Detection with Class-Agnostic Object Detectors”.',
				fr: 'Co-auteur d’un article accepté à IEEE ICIP 2026 : « Improving Cross-Domain Marine Animal Detection with Class-Agnostic Object Detectors ».'
			}
		],
		tech: ['PyTorch', 'torchvision', 'Faster R-CNN', 'COCO', 'Python', 'Bash'],
		quote: {
			text: {
				en: 'A very good collaborator, serious and committed. He has a solid grasp of Machine Learning and proposes relevant solutions while staying pragmatic. He is also reliable, pleasant to work with and always ready to share his knowledge.',
				fr: 'Très bon collaborateur, sérieux et impliqué. Il maîtrise bien les sujets de Machine Learning et sait proposer des solutions pertinentes tout en restant pragmatique. C’est également quelqu’un de fiable, agréable avec qui travailler et toujours prêt à partager ses connaissances.'
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
				en: 'Designed and built a web application from scratch for a client (under NDA).',
				fr: 'Conception et développement d’une application web, à partir de zéro, pour un client (projet sous NDA).'
			},
			{
				en: 'Set up the dev environment, designed the database (SurrealDB), and built the backend, API routes and authentication.',
				fr: 'Mise en place de l’environnement de développement, architecture de la base de données (SurrealDB), développement du backend, des routes API et de l’authentification.'
			},
			{
				en: 'Built the frontend, integrating mock-ups from a designer.',
				fr: 'Développement du frontend avec intégration de maquettes fournies par un designer.'
			}
		],
		tech: ['JavaScript', 'SvelteKit', 'Node.js', 'Express', 'SurrealDB'],
		quote: {
			text: {
				en: 'He took a full part in developing our platform, on both front-end and back-end. He proved serious, autonomous and committed, quick to grasp technical problems and propose suitable solutions. […] I recommend him without hesitation for Full Stack development work.',
				fr: 'Il a pleinement participé au développement de notre plateforme, aussi bien sur les sujets front-end que back-end. Il s’est montré sérieux, autonome et impliqué, avec une bonne capacité à comprendre rapidement les problématiques techniques et à proposer des solutions adaptées. […] Je le recommande sans hésitation pour des missions de développement Full Stack.'
			},
			author: 'Vincent Tamme',
			role: { en: 'President, Y247 Group', fr: 'Président, Y247 Group' },
			original: 'fr'
		}
	}
]);

/** Education. Order here doesn't matter: the page sorts newest first. */
export const EDUCATION = typeset<Education[]>([
	{
		school: '42 Lyon',
		title: { en: 'Expert in computer architecture', fr: 'Expert en architecture informatique' },
		start: '2022',
		end: '2026',
		points: [
			{
				en: 'RNCP level 7 (Master’s level): information systems & networks',
				fr: 'Titre RNCP niveau 7 (Bac+5) : systèmes d’information et réseaux'
			},
			{
				en: 'RNCP level 6 (Bachelor’s level): software solutions designer-developer, web & mobile',
				fr: 'Titre RNCP niveau 6 (Bac+3) : concepteur développeur de solutions informatiques, web et mobile'
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
]);

/** Hackathon results. Order here doesn't matter: the page sorts newest first. */
export const HACKATHONS = typeset<Hackathon[]>([
	{ medal: 1, event: 'Paris Blockchain Week', date: '2024-04', project: 'KAYP', projectId: 'kayp' },
	{ medal: 1, event: 'H-W3B Paris', date: '2024-03', project: 'KAYP', projectId: 'kayp' },
	{ medal: 2, event: 'H-W3B Super Finale', date: '2024-11', project: 'KAYP', projectId: 'kayp' },
	{
		medal: 3,
		event: 'Paris Blockchain Week',
		date: '2025-04',
		project: 'Bahapad',
		projectId: 'bahapad'
	},
	{
		medal: 3,
		event: 'CND',
		fullName: 'Commissariat au Numérique de Défense',
		date: '2025-11',
		project: { en: 'Firewall log triage', fr: 'Tri de logs pare-feu' }
	}
]);
