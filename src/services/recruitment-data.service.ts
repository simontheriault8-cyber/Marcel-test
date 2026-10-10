import { Injectable } from "@angular/core";

export interface RejectionReason {
  id: string;
  labelFr: string;
  labelEn: string;
  instructionFr: string;
  instructionEn: string;
  logNoteFr: string;
  linkFr?: string;
  linkEn?: string;
  isConfirmation?: boolean;
  isAdditionalDoc?: boolean;
}

export interface DocumentItem {
  nameFr: string;
  nameEn: string;
  reasons: RejectionReason[];
}

export interface Task {
  nameFr: string;
  nameEn: string;
  section?: string;
  documents: DocumentItem[];
}

@Injectable({
  providedIn: "root",
})
export class RecruitmentDataService {
  // Data structure manually parsed and translated from the provided CSV content
  private readonly data: Task[] = [
    {
      nameFr:
        "Relevés de notes et diplômes officiels canadiens ou évaluation comparative des études canadiennes",
      nameEn:
        "Transcripts / Diplomas or Comparative Evaluation of Canadian Studies",
      documents: [
        {
          nameFr: "Relevé d'apprentissage",
          nameEn: "Transcript",
          reasons: [
            {
              id: "relev_flou",
              labelFr: "Floue / illisible",
              labelEn: "Blurred / Illegible",
              instructionFr:
                "Le document est floue et illisible. Veuillez prendre une nouvelle photo et la téléverser à nouveau. Assurez vous que l’image est nette, sans reflet et que toutes les informations sont clairement visibles.",
              instructionEn:
                "The document is blurred and illegible. Please take a new photo and upload it again. Ensure the image is sharp, without glare, and all information is clearly visible.",
              logNoteFr: "Relevé d’apprentissage flou",
            },
            {
              id: "relev_incomp",
              labelFr: "Document incomplet sur la photo",
              labelEn: "Incomplete document in the photo",
              instructionFr:
                "Le document est incomplet sur la photo, il manque des pages ou le document n’est pas totalement visible. Veuillez téléverser une ou plusieurs photos du document en vous assurant que l’image est nette, sans reflet et que toutes les informations sont clairement visibles.",
              instructionEn:
                "The document is incomplete in the photo, pages are missing, or it is not fully visible. Please upload one or more photos of the document, ensuring the image is sharp, without glare, and all information is clearly visible.",
              logNoteFr: "Relevé d’apprentissage incomplet",
            },
            {
              id: "relev_inexist",
              labelFr: "Inexistant au dossier",
              labelEn: "Missing from file",
              instructionFr:
                "Le document n’est pas à votre dossier. Veuillez prendre une photo et la téléverser. Assurez vous que l’image est nette, sans reflet et que toutes les informations sont clairement visibles. Vous pouvez en faire la demande ici si vous ne l’avez pas : https://formulaires-consultations.education.gouv.qc.ca/dev_ti/412_demande_releves_diplomes_secondaires/",
              instructionEn:
                "The document is not in your file. Please take a photo and upload it. Ensure the image is sharp, without glare, and all information is clearly visible.",
              logNoteFr: "Aucun relevé d’apprentissage au dossier",
            },
            {
              id: "relev_maj",
              labelFr: "Mise à jour du document",
              labelEn: "Document update",
              instructionFr:
                "Pour la réouverture de votre dossier, nous aurons besoin que vous téléversiez la version la plus à jours de ce document dans votre portail du postulant.",
              instructionEn:
                "For the reopening of your file, we will need you to upload the most up-to-date version of this document to your applicant portal.",
              logNoteFr: "Mise à jour du relevé d’apprentissage",
            },
          ],
        },
        {
          nameFr: "Lettre d'admission sans condition Université civil canadienne",
          nameEn: "Unconditional admission letter Canadian civilian university",
          reasons: [
            {
              id: "lettre_adm_civil_flou",
              labelFr: "Floue / illisible",
              labelEn: "Blurred / Illegible",
              instructionFr:
                "Le document est floue et illisible. Veuillez prendre une nouvelle photo et la téléverser à nouveau. Assurez vous que l’image est nette, sans reflet et que toutes les informations sont clairement visibles.",
              instructionEn:
                "The document is blurred and illegible. Please take a new photo and upload it again. Ensure the image is sharp, without glare, and all information is clearly visible.",
              logNoteFr: "Lettre d'admission sans condition Université civile floue",
            },
            {
              id: "lettre_adm_civil_incomp",
              labelFr: "Document incomplet sur la photo",
              labelEn: "Incomplete document in the photo",
              instructionFr:
                "Le document est incomplet sur la photo, il manque des pages ou le document n’est pas totalement visible. Veuillez téléverser une ou plusieurs photos du document en vous assurant que l’image est nette, sans reflet et que toutes les informations sont clairement visibles.",
              instructionEn:
                "The document is incomplete in the photo, pages are missing, or it is not fully visible. Please upload one or more photos of the document, ensuring the image is sharp, without glare, and all information is clearly visible.",
              logNoteFr: "Lettre d'admission sans condition Université civile incomplète",
            },
            {
              id: "lettre_adm_civil_inexist",
              labelFr: "Inexistant au dossier",
              labelEn: "Missing from file",
              instructionFr:
                "Veuillez nous fournir votre lettre d'admission officielle sans conditions confirmant votre inscription ou une preuve de fréquentation dans un établissement scolaire agréé pour votre programme d'études subventionnées. Il doit être mentionné que vous étudier à temps plein et avoir la date de fin prévu de vos études.\n\nLa réception de ce document est nécessaire pour permettre la poursuite de votre dossier et confirmer votre admissibilité au programme d’études subventionnées.\n\nEn consultant le lien ci-dessous, vous trouverez la liste des programmes d’études admissibles selon les différents métiers offerts :",
              instructionEn:
                "Please provide your official letter of admission without conditions confirming your enrollment or a proof of attendance in an accredited educational institution for your subsidized study program by replying to this email. The document must indicate that you are studying on a full-time basis and include the expected completion date of your studies.\n\nThis documentation is required to allow us to proceed with the assessment of your application and confirm your eligibility for the subsidized education program.\n\nBy following the link below, you will find a list of eligible academic programs associated with the various occupations available through the ROTP:",
              linkFr:
                'Voici un lien vers la <a href="https://forces.ca/fr/programmes-admissibles/" target="_blank" style="color: #2563eb; text-decoration: underline;">Liste des programmes admissibles par métier</a>.',
              linkEn:
                'Here is a link to the <a href="https://forces.ca/en/eligible-programmes/" target="_blank" style="color: #2563eb; text-decoration: underline;">List of Eligible Programs by Occupation</a>.',
              logNoteFr: "Aucune lettre d'admission sans condition Université civile au dossier",
            },
            {
              id: "lettre_adm_civil_maj",
              labelFr: "Mise à jour du document",
              labelEn: "Document update",
              instructionFr:
                "Pour la réouverture de votre dossier, nous aurons besoin que vous téléversiez la version la plus à jours de ce document dans votre portail du postulant.",
              instructionEn:
                "For the reopening of your file, we will need you to upload the most up-to-date version of this document to your applicant portal.",
              logNoteFr: "Mise à jour de la lettre d'admission sans condition Université civile",
            },
          ],
        },
        {
          nameFr: "Diplômes et certificats",
          nameEn: "Diplomas and Certificates",
          reasons: [
            {
              id: "dipl_flou",
              labelFr: "Floue / illisible",
              labelEn: "Blurred / Illegible",
              instructionFr:
                "Le document est floue et illisible. Veuillez prendre une nouvelle photo et la téléverser à nouveau. Assurez vous que l’image est nette, sans reflet et que toutes les informations sont clairement visibles.",
              instructionEn:
                "The document is blurred and illegible. Please take a new photo and upload it again. Ensure the image is sharp, without glare, and all information is clearly visible.",
              logNoteFr: "Diplômes et certificats flous",
            },
            {
              id: "dipl_photocopie",
              labelFr: "Photocopie",
              labelEn: "Photocopy",
              instructionFr:
                "La photocopie de vos diplômes ou certificats n'est pas acceptée (un document original est exigé). Vous devez prendre une photo de votre document original et téléverser cette photo sur votre portail en ligne. Assurez-vous que l'image est nette et sans reflet.",
              instructionEn:
                "The photocopy of your diplomas or certificates is not accepted (an original document is required). You must take a photo of your original document and upload this photo to your online portal. Ensure the image is sharp, without glare, and all information is clearly visible.",
              logNoteFr: "Diplômes et certificats est une photocopie",
            },
            {
              id: "dipl_inexist",
              labelFr: "Inexistant au dossier",
              labelEn: "Missing from file",
              instructionFr:
                "Le document n’est pas à votre dossier. Veuillez prendre une photo et la téléverser. Assurez vous que l’image est nette, sans reflet et que toutes les informations sont clairement visibles.",
              instructionEn:
                "The document is not in your file. Please take a photo and upload it. Ensure the image is sharp, without glare, and all information is clearly visible.",
              logNoteFr: "Aucun diplômes ou certificats au dossier",
            },
            {
              id: "dipl_incomplet",
              labelFr: "Document incomplet sur la photo",
              labelEn: "Incomplete document in the photo",
              instructionFr:
                "Le document est incomplet sur la photo, il manque des pages ou le document n’est pas totalement visible. Veuillez téléverser une ou plusieurs photos du document en vous assurant que l’image est nette, sans reflet et que toutes les informations sont clairement visibles.",
              instructionEn:
                "The document is incomplete in the photo, pages are missing, or it is not fully visible. Please upload one or more photos of the document, ensuring the image is sharp, without glare, and all information is clearly visible.",
              logNoteFr: "Diplômes et certificats incomplets",
            },
            {
              id: "dipl_maj",
              labelFr: "Mise à jour du document",
              labelEn: "Document update",
              instructionFr:
                "Pour la réouverture de votre dossier, nous aurons besoin que vous téléversiez la version la plus à jours de ce document dans votre portail du postulant.",
              instructionEn:
                "For the reopening of your file, we will need you to upload the most up-to-date version of this document to your applicant portal.",
              logNoteFr: "Mise à jour des diplômes et certificats",
            },
          ],
        },
        {
          nameFr: "Évaluation comparative",
          nameEn: "Comparative Evaluation",
          reasons: [
            {
              id: "eval_flou",
              labelFr: "Floue / illisible",
              labelEn: "Blurred / Illegible",
              instructionFr:
                "Le document est floue et illisible. Veuillez prendre une nouvelle photo et la téléverser à nouveau. Assurez vous que l’image est nette, sans reflet et que toutes les informations sont clairement visibles.",
              instructionEn:
                "The document is blurred and illegible. Please take a new photo and upload it again. Ensure the image is sharp, without glare, and all information is clearly visible.",
              logNoteFr: "Évaluation comparative floue",
            },
            {
              id: "eval_incomp",
              labelFr: "Document incomplet sur la photo",
              labelEn: "Incomplete document in the photo",
              instructionFr:
                "Le document est incomplet sur la photo, il manque des pages ou le document n’est pas totalement visible. Veuillez téléverser une ou plusieurs photos du document en vous assurant que l’image est nette, sans reflet et que toutes les informations sont clairement visibles. Pour vous aider à trouver des ressources pour cette étape, veuillez consulter le site suivant : https://canalliance.org/fr/",
              instructionEn:
                "The document is incomplete in the photo, pages are missing, or it is not fully visible. Please upload one or more photos of the document, ensuring the image is sharp, without glare, and all information is clearly visible. To help you find resources for this step, please visit the following site: https://canalliance.org/en/",
              logNoteFr: "Évaluation comparative incomplète",
            },
            {
              id: "eval_inexist",
              labelFr: "Inexistant au dossier",
              labelEn: "Missing from file",
              instructionFr:
                "Le document n’est pas à votre dossier. Veuillez prendre une photo et la téléverser. Assurez vous que l’image est nette, sans reflet et que toutes les informations sont clairement visibles. Pour vous aider à trouver des ressources pour cette étape, veuillez consulter le site suivant : https://canalliance.org/fr/",
              instructionEn:
                "The document is not in your file. Please take a photo and upload it. Ensure the image is sharp, without glare, and all information is clearly visible. To help you find resources for this step, please visit the following site: https://canalliance.org/en/",
              logNoteFr: "Aucune évaluation comparative au dossier",
            },
            {
              id: "eval_etrang",
              labelFr: "Relevé de note étranger",
              labelEn: "Foreign Transcript",
              instructionFr:
                "Un relevé de notes provenant de l'extérieur du Canada nécessite une évaluation de ses équivalences. Un relevé étranger seul n’est pas accepté, vous devez fournir une évaluation comparative officielle. Pour trouver des ressources, consultez : https://canalliance.org/fr/",
              instructionEn:
                "Foreign transcripts are not accepted, and you must provide an official comparative evaluation. To help you find resources for this step, please visit the following site: https://canalliance.org/en/",
              logNoteFr:
                "Relevé de note étranger non accepté, doit envoyer une évaluation comparative",
            },
            {
              id: "eval_trad",
              labelFr: "Traduction d’un relevé de note",
              labelEn: "Transcript Translation",
              instructionFr:
                "La traduction du relevé de note étrangé n’est pas suffisant, vous devez fournir une évaluation comparative officielle. Pour vous aider à trouver des ressources pour cette étape, veuillez consulter le site suivant : https://canalliance.org/fr/",
              instructionEn:
                "The translation of the foreign transcript is not sufficient; you must provide an official comparative evaluation. To help you find resources for this step, please visit the following site: https://canalliance.org/en/",
              logNoteFr:
                "Traduction du relevé de note étranger non acceptée, doit envoyer une évaluation comparative",
            },
            {
              id: "eval_non_officiel",
              labelFr: "Non officiel",
              labelEn: "Unofficial",
              instructionFr:
                "Veuillez fournir une copie officielle de votre évaluation comparative. Pour vous aider à trouver des ressources pour cette étape, veuillez consulter le site suivant : https://canalliance.org/fr/",
              instructionEn:
                "Please provide an official copy of your comparative evaluation. To help you find resources for this step, please visit the following site: https://canalliance.org/en/",
              logNoteFr: "Évaluation comparative non officielle",
            },
            {
              id: "eval_maj",
              labelFr: "Mise à jour du document",
              labelEn: "Document update",
              instructionFr:
                "Pour la réouverture de votre dossier, nous aurons besoin que vous téléversiez la version la plus à jours de ce document dans votre portail du postulant.",
              instructionEn:
                "For the reopening of your file, we will need you to upload the most up-to-date version of this document to your applicant portal.",
              logNoteFr: "Mise à jour de l'évaluation comparative",
            },
          ],
        },
        {
          nameFr: "Document n'est pas un relevé de notes ou diplôme valide",
          nameEn: "Document is not a valid transcript or diploma",
          reasons: [
            {
              id: "educ_aens_sans_releve",
              labelFr: "Diplôme d'AENS sans le relevé de note",
              labelEn: "AENS Diploma without transcript",
              instructionFr:
                "Vous avez fourni un diplôme d'Attestation d’études de niveau secondaire (AENS). Toutefois, afin de valider votre scolarité, vous devez nous fournir le relevé de notes qui l'accompagne. Veuillez téléverser votre relevé de notes pour l'AENS.",
              linkFr: "Voici un lien vers un exemple de <a href=\"https://simontheriault8-cyber.github.io/Documents/Relev%C3%A9%20de%20note%20AENS%20d'une%20%C3%A9cole.png\">relevé de notes pour l'AENS</a>.",
              instructionEn:
                "You have provided a Secondary School Equivalency Attestation (TENS) diploma. However, in order to validate your education, you must provide the accompanying transcript. Please upload your TENS transcript.",
              linkEn: "Here is a link to an example of a <a href=\"https://simontheriault8-cyber.github.io/Documents/Relev%C3%A9%20de%20note%20AENS%20d'une%20%C3%A9cole.png\">TENS transcript</a>.",
              logNoteFr: "Diplôme d'AENS sans le relevé de note",
            },
            {
              id: "educ_non_admissible",
              labelFr: "N'a pas les critères académiques de base",
              labelEn: "Does not meet basic academic requirements",
              instructionFr:
                "L’évaluation des documents que vous avez fournis nous indique que vous n’êtes pas admissible à un enrôlement au sein des Forces armées canadiennes.\n\nVoici les 3 façons de répondre au critère d’entrée académique minimum :\n  • 24 crédits de secondaire 4 ou 5 (les crédits de formation professionnelle ne sont pas acceptés dans le calcul)\n  • Diplôme d’études professionnelles (DEP) complété\n  • Attestation d’études de niveau secondaire (AENS)\n\nRemarque : La réussite du Test de développement général (TDG) n’est pas acceptée.\n\nVoici un lien qui pourrait vous être utile :\nChallengeU - Plateforme en ligne - Formation à distance : <a href=\"https://www.challengeu.ca/\" target=\"_blank\" class=\"text-indigo-600 underline font-medium hover:text-indigo-800\">https://www.challengeu.ca/</a>\n\nPour les études faites à l’étranger, communiquez avec un des six membres de l'Alliance canadienne des services d'évaluation de diplômes afin d’obtenir le rapport d’étude comparative avant de nous recontacter afin que nous puissions valider vos acquis scolaires.\n\nPour obtenir de l’information additionnelle à ce sujet, consultez les liens suivants :\n  • <a href=\"https://www.cicdi.ca\" target=\"_blank\" class=\"text-indigo-600 underline font-medium hover:text-indigo-800\">www.cicdi.ca</a>\n  • <a href=\"https://canalliance.org/\" target=\"_blank\" class=\"text-indigo-600 underline font-medium hover:text-indigo-800\">https://canalliance.org/</a>\n\nPour le moment vous ne répondez pas au critère d’entrée académique minimum.",
              instructionEn:
                "The evaluation of the documents you provided indicates that you are not eligible for enrollment in the Canadian Armed Forces.\n\nHere are the 3 ways to meet the minimum academic entry requirement:\n  • 24 credits of Secondary 4 or 5 (vocational training credits are not accepted in the calculation)\n  • Completed Diploma of Vocational Studies (DVS)\n  • Secondary School Equivalency Attestation (TENS)\n\nNote: Successful completion of the General Development Test (GDT) is not accepted.\n\nHere is a link that might be useful:\nChallengeU - Online Platform - Distance Learning: <a href=\"https://www.challengeu.ca/\" target=\"_blank\" class=\"text-indigo-600 underline font-medium hover:text-indigo-800\">https://www.challengeu.ca/</a>\n\nFor studies completed abroad, please contact one of the six members of the Canadian Alliance of Credential Evaluation Services to obtain a comparative evaluation report before contacting us again so we can validate your educational background.\n\nFor additional information on this subject, please consult the following links:\n  • <a href=\"https://www.cicdi.ca\" target=\"_blank\" class=\"text-indigo-600 underline font-medium hover:text-indigo-800\">www.cicdi.ca</a>\n  • <a href=\"https://canalliance.org/\" target=\"_blank\" class=\"text-indigo-600 underline font-medium hover:text-indigo-800\">https://canalliance.org/</a>\n\nAt the moment you do not meet the minimum academic entry requirement.",
              logNoteFr: "N'a pas les critères académiques de base",
            },
            {
              id: "educ_doc_invalide",
              labelFr: "Document scolaire non officiel / invalide",
              labelEn: "Unofficial / invalid school document",
              instructionFr:
                "Ce document n'est pas un relevé de notes ou diplôme accepté. Veuillez téléverser un relevé d'apprentissage officiel de votre province ou votre diplôme officiel.\n\nPour les études faites à l’étranger, communiquez avec un des six membres de l'Alliance canadienne des services d'évaluation de diplômes afin d’obtenir le rapport d’étude comparative avant de nous recontacter afin que nous puissions valider vos acquis scolaires.\n\nPour obtenir de l’information additionnelle à ce sujet, consultez les liens suivants :\n  • <a href=\"https://www.cicdi.ca\" target=\"_blank\" class=\"text-indigo-600 underline font-medium hover:text-indigo-800\">www.cicdi.ca</a>\n  • <a href=\"https://canalliance.org/\" target=\"_blank\" class=\"text-indigo-600 underline font-medium hover:text-indigo-800\">https://canalliance.org/</a>",
              instructionEn:
                "This document is not an accepted transcript or diploma. Please upload an official transcript from your province or your official diploma.\n\nFor studies completed abroad, please contact one of the six members of the Canadian Alliance of Credential Evaluation Services to obtain a comparative evaluation report before contacting us again so we can validate your educational background.\n\nFor additional information on this subject, please consult the following links:\n  • <a href=\"https://www.cicdi.ca\" target=\"_blank\" class=\"text-indigo-600 underline font-medium hover:text-indigo-800\">www.cicdi.ca</a>\n  • <a href=\"https://canalliance.org/\" target=\"_blank\" class=\"text-indigo-600 underline font-medium hover:text-indigo-800\">https://canalliance.org/</a>",
              logNoteFr:
                "Document soumis n'est pas un document scolaire valide",
            },
            {
              id: "educ_tdg",
              labelFr: "Test de développement général (TDG)",
              labelEn: "General Development Test (GDT)",
              instructionFr:
                "La réussite du Test de développement général (TDG) n’est pas acceptée.\n\nVoici les 3 façons de répondre au critère d’entrée académique minimum :\n  • 24 crédits de secondaire 4 ou 5 (les crédits de formation professionnelle ne sont pas acceptés dans le calcul)\n  • Diplôme d’études professionnelles (DEP) complété\n  • Attestation d’études de niveau secondaire (AENS)\n\nPour les études faites à l’étranger, communiquez avec un des six membres de l'Alliance canadienne des services d'évaluation de diplômes afin d’obtenir le rapport d’étude comparative avant de nous recontacter afin que nous puissions valider vos acquis scolaires.\n\nPour obtenir de l’information additionnelle à ce sujet, consultez les liens suivants :\n  • <a href=\"https://www.cicdi.ca\" target=\"_blank\" class=\"text-indigo-600 underline font-medium hover:text-indigo-800\">www.cicdi.ca</a>\n  • <a href=\"https://canalliance.org/\" target=\"_blank\" class=\"text-indigo-600 underline font-medium hover:text-indigo-800\">https://canalliance.org/</a>",
              instructionEn:
                "Successful completion of the General Development Test (GDT) is not accepted.\n\nHere are the 3 ways to meet the minimum academic entry requirement:\n  • 24 credits of Secondary 4 or 5 (vocational training credits are not accepted in the calculation)\n  • Completed Diploma of Vocational Studies (DVS)\n  • Secondary School Equivalency Attestation (TENS)\n\nFor studies completed abroad, please contact one of the six members of the Canadian Alliance of Credential Evaluation Services to obtain a comparative evaluation report before contacting us again so we can validate your educational background.\n\nFor additional information on this subject, please consult the following links:\n  • <a href=\"https://www.cicdi.ca\" target=\"_blank\" class=\"text-indigo-600 underline font-medium hover:text-indigo-800\">www.cicdi.ca</a>\n  • <a href=\"https://canalliance.org/\" target=\"_blank\" class=\"text-indigo-600 underline font-medium hover:text-indigo-800\">https://canalliance.org/</a>",
              logNoteFr:
                "Test de développement général (TDG) soumis, refusé. Doit avoir 24 crédits, DEP ou AENS",
            },
            {
              id: "educ_aec",
              labelFr: "Attestation d'études collégiales (AEC)",
              labelEn: "Attestation of College Studies (AEC)",
              instructionFr:
                "Une attestation d'études collégiales (AEC) n'est pas acceptée comme preuve de scolarité valide.\n\nVoici les 3 façons de répondre au critère d’entrée académique minimum :\n  • 24 crédits de secondaire 4 ou 5 (les crédits de formation professionnelle ne sont pas acceptés dans le calcul)\n  • Diplôme d’études professionnelles (DEP) complété\n  • Attestation d’études de niveau secondaire (AENS)\n\nRemarque : La réussite du Test de développement général (TDG) n’est pas acceptée.\n\nVoici un lien qui pourrait vous être utile :\nChallengeU - Plateforme en ligne - Formation à distance : <a href=\"https://www.challengeu.ca/\" target=\"_blank\" class=\"text-indigo-600 underline font-medium hover:text-indigo-800\">https://www.challengeu.ca/</a>\n\nPour les études faites à l’étranger, communiquez avec un des six membres de l'Alliance canadienne des services d'évaluation de diplômes afin d’obtenir le rapport d’étude comparative avant de nous recontacter afin que nous puissions valider vos acquis scolaires.\n\nPour obtenir de l’information additionnelle à ce sujet, consultez les liens suivants :\n  • <a href=\"https://www.cicdi.ca\" target=\"_blank\" class=\"text-indigo-600 underline font-medium hover:text-indigo-800\">www.cicdi.ca</a>\n  • <a href=\"https://canalliance.org/\" target=\"_blank\" class=\"text-indigo-600 underline font-medium hover:text-indigo-800\">https://canalliance.org/</a>",
              instructionEn:
                "An Attestation of College Studies (AEC) is not accepted as valid proof of education.\n\nHere are the 3 ways to meet the minimum academic entry requirement:\n  • 24 credits of Secondary 4 or 5 (vocational training credits are not accepted in the calculation)\n  • Completed Diploma of Vocational Studies (DVS)\n  • Secondary School Equivalency Attestation (TENS)\n\nNote: Successful completion of the General Development Test (GDT) is not accepted.\n\nHere is a link that might be useful:\nChallengeU - Online Platform - Distance Learning: <a href=\"https://www.challengeu.ca/\" target=\"_blank\" class=\"text-indigo-600 underline font-medium hover:text-indigo-800\">https://www.challengeu.ca/</a>\n\nFor studies completed abroad, please contact one of the six members of the Canadian Alliance of Credential Evaluation Services to obtain a comparative evaluation report before contacting us again so we can validate your educational background.\n\nFor additional information on this subject, please consult the following links:\n  • <a href=\"https://www.cicdi.ca\" target=\"_blank\" class=\"text-indigo-600 underline font-medium hover:text-indigo-800\">www.cicdi.ca</a>\n  • <a href=\"https://canalliance.org/\" target=\"_blank\" class=\"text-indigo-600 underline font-medium hover:text-indigo-800\">https://canalliance.org/</a>",
              logNoteFr:
                "Une AEC a été soumise, ce qui n'est pas un document scolaire accepté",
            },
            {
              id: "educ_master_need_bachelor",
              labelFr: "Maîtrise soumise (Baccalauréat ou Secondaire requis)",
              labelEn:
                "Master's submitted (Bachelor's or High School required)",
              instructionFr:
                "Vous avez soumis un diplôme de maîtrise, mais nous avons besoin de votre diplôme de baccalauréat et/ou de votre relevé de notes du secondaire pour vérifier votre admissibilité. Veuillez téléverser votre diplôme de baccalauréat et/ou votre relevé de notes du secondaire.\n\nPour les études faites à l’étranger, communiquez avec un des six membres de l'Alliance canadienne des services d'évaluation de diplômes afin d’obtenir le rapport d’étude comparative avant de nous recontacter afin que nous puissions valider vos acquis scolaires.\n\nPour obtenir de l’information additionnelle à ce sujet, consultez les liens suivants :\n  • <a href=\"https://www.cicdi.ca\" target=\"_blank\" class=\"text-indigo-600 underline font-medium hover:text-indigo-800\">www.cicdi.ca</a>\n  • <a href=\"https://canalliance.org/\" target=\"_blank\" class=\"text-indigo-600 underline font-medium hover:text-indigo-800\">https://canalliance.org/</a>",
              instructionEn:
                "You submitted a Master's degree, but we need your Bachelor's degree and/or high school transcript to verify your eligibility. Please upload your Bachelor's degree and/or your high school transcript.\n\nFor studies completed abroad, please contact one of the six members of the Canadian Alliance of Credential Evaluation Services to obtain a comparative evaluation report before contacting us again so we can validate your educational background.\n\nFor additional information on this subject, please consult the following links:\n  • <a href=\"https://www.cicdi.ca\" target=\"_blank\" class=\"text-indigo-600 underline font-medium hover:text-indigo-800\">www.cicdi.ca</a>\n  • <a href=\"https://canalliance.org/\" target=\"_blank\" class=\"text-indigo-600 underline font-medium hover:text-indigo-800\">https://canalliance.org/</a>",
              logNoteFr:
                "Maîtrise soumise au lieu du Baccalauréat ou secondaire",
            },
            {
              id: "educ_cert_submitted",
              labelFr: "Certificat soumis (Baccalauréat ou Secondaire requis)",
              labelEn:
                "Certificate submitted (Bachelor's or High School required)",
              instructionFr:
                "Vous avez soumis un certificat, mais nous avons besoin de votre diplôme de baccalauréat et/ou de votre relevé de notes du secondaire pour vérifier votre admissibilité. Veuillez téléverser votre diplôme de baccalauréat et/ou votre relevé de notes du secondaire.\n\nPour les études faites à l’étranger, communiquez avec un des six membres de l'Alliance canadienne des services d'évaluation de diplômes afin d’obtenir le rapport d’étude comparative avant de nous recontacter afin que nous puissions valider vos acquis scolaires.\n\nPour obtenir de l’information additionnelle à ce sujet, consultez les liens suivants :\n  • <a href=\"https://www.cicdi.ca\" target=\"_blank\" class=\"text-indigo-600 underline font-medium hover:text-indigo-800\">www.cicdi.ca</a>\n  • <a href=\"https://canalliance.org/\" target=\"_blank\" class=\"text-indigo-600 underline font-medium hover:text-indigo-800\">https://canalliance.org/</a>",
              instructionEn:
                "You submitted a certificate, but we need your Bachelor's degree and/or high school transcript to verify your eligibility. Please upload your Bachelor's degree and/or your high school transcript.\n\nFor studies completed abroad, please contact one of the six members of the Canadian Alliance of Credential Evaluation Services to obtain a comparative evaluation report before contacting us again so we can validate your educational background.\n\nFor additional information on this subject, please consult the following links:\n  • <a href=\"https://www.cicdi.ca\" target=\"_blank\" class=\"text-indigo-600 underline font-medium hover:text-indigo-800\">www.cicdi.ca</a>\n  • <a href=\"https://canalliance.org/\" target=\"_blank\" class=\"text-indigo-600 underline font-medium hover:text-indigo-800\">https://canalliance.org/</a>",
              logNoteFr:
                "Certificat soumis au lieu du Baccalauréat ou secondaire",
            },
            {
              id: "relev_ecole",
              labelFr: "Relevé de note de l’école (Bulletin)",
              labelEn: "School Report Card",
              instructionFr:
                "Un simple bulletin scolaire émis par votre école n'est pas accepté comme preuve de scolarité. Vous devez nous fournir le relevé d'apprentissage officiel émis par le Ministère de l'Éducation (avec le sceau ou le format officiel du Ministère). Vous pouvez en faire la demande ici si vous ne l’avez pas : <a href=\"https://formulaires-consultations.education.gouv.qc.ca/dev_ti/412_demande_releves_diplomes_secondaire/fr\" target=\"_blank\" class=\"text-indigo-600 underline font-medium hover:text-indigo-800\">Demande de relevés et de diplômes du secondaire</a>",
              instructionEn:
                "A simple report card issued by your school is not accepted as proof of education. You must provide the official transcript (relevé d'apprentissage) issued by the Ministry of Education (bearing the official Ministry seal or format). You can request it here if you do not have it: <a href=\"https://formulaires-consultations.education.gouv.qc.ca/dev_ti/412_demande_releves_diplomes_secondaire/en/a/FORM\" target=\"_blank\" class=\"text-indigo-600 underline font-medium hover:text-indigo-800\">Request for transcripts and high school diplomas</a>",
              logNoteFr:
                "Relevé de note de l’école non acceptés, doit téléverser le relevé d’apprentissage du ministère",
            },
          ],
        },
      ],
    },
    {
      nameFr:
        "Pièce d'identité avec photo émise par le gouvernement canadien (les deux côtés)",
      nameEn: "Government-issued photo ID (both sides)",
      documents: [
        {
          nameFr: "Égoportrait (Selfie) avec pièce d'identité",
          nameEn: "Selfie with ID",
          reasons: [
            {
              id: "selfie_floue",
              labelFr: "Floue / illisible",
              labelEn: "Blurred / Illegible",
              instructionFr:
                "La photo de vous et votre pièce d’identité est floue et illisible. Veuillez prendre une nouvelle photo et la téléverser à nouveau. Assurez vous que l’image est nette, sans reflet et que toutes les informations sont clairement visibles.",
              linkFr: "Voici le lien vers un exemple d'<a href=\"https://simontheriault8-cyber.github.io/Documents/%C3%89goportrait.png\">égoportrait</a> acceptable.",
              instructionEn:
                "The photo of you and your ID is blurred and illegible. Please take a new photo and upload it again. Ensure the image is sharp, without glare, and all information is clearly visible.",
              linkEn: "Here is a link to an acceptable example of a <a href=\"https://simontheriault8-cyber.github.io/Documents/%C3%89goportrait.png\">selfie</a>.",
              logNoteFr: "Égoportrait (Selfie) avec pièce d’identité flou",
            },
            {
              id: "selfie_mauvaise",
              labelFr: "Mauvaise pièce d’identité",
              labelEn: "Wrong ID",
              instructionFr:
                "La pièce d'identité que vous tenez dans vos mains sur la photo ne correspond pas à celle que vous avez téléversée au dossier. Si vous avez soumis un permis de conduire, vous devez tenir ce même permis de conduire sur votre égoportrait (selfie). Veuillez téléverser une nouvelle photo correspondante.",
              linkFr: "Voici le lien vers un exemple d'<a href=\"https://simontheriault8-cyber.github.io/Documents/%C3%89goportrait.png\">égoportrait</a> acceptable.",
              instructionEn:
                "The ID held does not match the one submitted to the file. Please upload a new photo of yourself holding the ID submitted to the file.",
              linkEn: "Here is a link to an acceptable example of a <a href=\"https://simontheriault8-cyber.github.io/Documents/%C3%89goportrait.png\">selfie</a>.",
              logNoteFr:
                "La pièce d'identité utilisée dans l'égoportrait (selfie) n'est pas la bonne",
            },
            {
              id: "selfie_inexistant",
              labelFr: "Inexistant au dossier",
              labelEn: "Missing from file",
              instructionFr:
                "La photo ne se trouve pas dans votre dossier, veuillez prendre un égoportrait (selfie) avec la pièce d'identité qui est dans votre dossier et téléverser cette photo sur votre portail en ligne. Vous devez tenir la pièce d'identité près de votre visage de façon à ce que votre visage et votre pièce d'identité soit clair et lisible.",
              linkFr: "Voici le lien vers un exemple d'<a href=\"https://simontheriault8-cyber.github.io/Documents/%C3%89goportrait.png\">égoportrait</a> acceptable.",
              instructionEn:
                "The document is not in your file. Please take a photo and upload it. Ensure the image is sharp, without glare, and all information is clearly visible.",
              linkEn: "Here is a link to an acceptable example of a <a href=\"https://simontheriault8-cyber.github.io/Documents/%C3%89goportrait.png\">selfie</a>.",
              logNoteFr:
                "Aucun égoportrait (selfie) avec pièce d'identité au dossier",
            },
            {
              id: "selfie_incomplet",
              labelFr: "Document incomplet sur la photo",
              labelEn: "Incomplete document in the photo",
              instructionFr:
                "La photo est incomplète, votre visage ou votre pièce d’identité n'est pas totalement visible sur la photo. Veuillez téléverser une nouvelle photo en vous assurant que votre visage et votre pièce d’identité sont clairement visibles.",
              linkFr: "Voici le lien vers un exemple d'<a href=\"https://simontheriault8-cyber.github.io/Documents/%C3%89goportrait.png\">égoportrait</a> acceptable.",
              instructionEn:
                "The photo is incomplete, your face or ID is not fully visible in the photo. Please upload a new photo ensuring both your face and ID are clearly visible.",
              linkEn: "Here is a link to an acceptable example of a <a href=\"https://simontheriault8-cyber.github.io/Documents/%C3%89goportrait.png\">selfie</a>.",
              logNoteFr:
                "Égoportrait (Selfie) avec pièce d’identité incomplet",
            },
            {
              id: "selfie_maj",
              labelFr: "Mise à jour du document",
              labelEn: "Document update",
              instructionFr:
                "Pour la réouverture de votre dossier, nous aurons besoin que vous téléversiez la version la plus à jours de ce document dans votre portail du postulant.",
              instructionEn:
                "For the reopening of your file, we will need you to upload the most up-to-date version of this document to your applicant portal.",
              logNoteFr: "Mise à jour de l'égoportrait (Selfie)",
            },
          ],
        },
        {
          nameFr: "Permis de conduire",
          nameEn: "Driver's License",
          reasons: [
            {
              id: "pc_floue",
              labelFr: "Floue / illisible",
              labelEn: "Blurred / Illegible",
              instructionFr:
                "Le document est floue et illisible. Veuillez prendre une nouvelle photo et la téléverser à nouveau. Assurez vous que l’image est nette, sans reflet et que toutes les informations sont clairement visibles.",
              instructionEn:
                "The document is blurred and illegible. Please take a new photo and upload it again. Ensure the image is sharp, without glare, and all information is clearly visible.",
              logNoteFr: "Pièce d'identité floue",
            },
            {
              id: "pc_expire",
              labelFr: "Expiré",
              labelEn: "Expired",
              instructionFr:
                "Votre permis de conduire est expiré. Veuillez téléverser une version valide ou une autre pièce d’identité officielle d’un gouvernement canadien. (carte d’assurance maladie, passeport, etc…)",
              instructionEn:
                "Your driver's license is expired. Please upload a valid version or another official Canadian government ID (health insurance card, etc.).",
              logNoteFr: "Pièce d'identité expirée",
            },
            {
              id: "pc_verso",
              labelFr: "Verso manquant",
              labelEn: "Back side missing",
              instructionFr:
                "Le verso du document est manquant; veuillez téléverser les deux côtés.",
              instructionEn:
                "The back of the document is missing; please upload both sides.",
              logNoteFr: "Verso manquant de la pièce d'identité",
            },
            {
              id: "pc_noir_blanc",
              labelFr: "Noir et blanc",
              labelEn: "Black and white",
              instructionFr:
                "Le document fourni n'est pas valide car il est en noir et blanc. Veuillez fournir une photo couleur du même document.",
              instructionEn:
                "The provided document is invalid because it is in black and white. Please provide a color photo of the same document.",
              logNoteFr: "Pièce d'identité en noir et blanc",
            },
            {
              id: "pc_incomplet",
              labelFr: "Document incomplet sur la photo",
              labelEn: "Incomplete document in the photo",
              instructionFr:
                "Le document est incomplet sur la photo, le document n’est pas totalement visible. Veuillez téléverser une photo du document en vous assurant que l’image est nette, sans reflet et que toutes les informations sont clairement visibles.",
              instructionEn:
                "The document is incomplete in the photo, or it is not fully visible. Please upload a photo of the document, ensuring the image is sharp, without glare, and all information is clearly visible.",
              logNoteFr: "Permis de conduire incomplet",
            },
            {
              id: "pc_maj",
              labelFr: "Mise à jour du document",
              labelEn: "Document update",
              instructionFr:
                "Pour la réouverture de votre dossier, nous aurons besoin que vous téléversiez la version la plus à jours de ce document dans votre portail du postulant.",
              instructionEn:
                "For the reopening of your file, we will need you to upload the most up-to-date version of this document to your applicant portal.",
              logNoteFr: "Mise à jour du permis de conduire",
            },
          ],
        },
        {
          nameFr: "Carte d'assurance maladie",
          nameEn: "Health Insurance Card",
          reasons: [
            {
              id: "ramq_floue",
              labelFr: "Floue / illisible",
              labelEn: "Blurred / Illegible",
              instructionFr:
                "Le document est floue et illisible. Veuillez prendre une nouvelle photo et la téléverser à nouveau. Assurez vous que l’image est nette, sans reflet et que toutes les informations sont clairement visibles.",
              instructionEn:
                "The document is blurred and illegible. Please take a new photo and upload it again. Ensure the image is sharp, without glare, and all information is clearly visible.",
              logNoteFr: "Pièce d'identité floue",
            },
            {
              id: "ramq_expire",
              labelFr: "Expiré",
              labelEn: "Expired",
              instructionFr:
                "Votre carte d’assurance maladie est expiré. Veuillez téléverser une version valide ou une autre pièce d’identité officielle d’un gouvernement canadien. (permis de conduire, passeport, etc…)",
              instructionEn:
                "Your health insurance card is expired. Please upload a valid version or another official Canadian government ID (driver's license, passport, etc.).",
              logNoteFr: "Pièce d'identité expirée",
            },
            {
              id: "ramq_verso",
              labelFr: "Verso manquant",
              labelEn: "Back side missing",
              instructionFr:
                "Le verso du document est manquant; veuillez téléverser les deux côtés.",
              instructionEn:
                "The back of the document is missing; please upload both sides.",
              logNoteFr: "Verso manquant de la pièce d'identité",
            },
            {
              id: "ramq_ontario",
              labelFr: "Carte de l’Ontario non acceptée",
              labelEn: "Ontario card not accepted",
              instructionFr:
                "La carte d'assurance maladie de l'Ontario n'est pas acceptée comme pièce d'identité au niveau fédéral; veuillez téléverser une autre pièce d’identité officielle d’un gouvernement canadien. (permis de conduire, passeport, etc…)",
              instructionEn:
                "The Ontario health insurance card is not accepted as ID at the federal level; please upload another official Canadian government ID (driver's license, passport, etc.).",
              logNoteFr:
                "Carte d'assurance maladie de l'Ontario non acceptée comme pièce d'identité",
            },
            {
              id: "ramq_noir_blanc",
              labelFr: "Noir et blanc",
              labelEn: "Black and white",
              instructionFr:
                "Le document fourni n'est pas valide car il est en noir et blanc. Veuillez fournir une photo couleur du même document.",
              instructionEn:
                "The provided document is invalid because it is in black and white. Please provide a color photo of the same document.",
              logNoteFr: "Pièce d'identité en noir et blanc",
            },
            {
              id: "ramq_incomplet",
              labelFr: "Document incomplet sur la photo",
              labelEn: "Incomplete document in the photo",
              instructionFr:
                "Le document est incomplet sur la photo, le document n’est pas totalement visible. Veuillez téléverser une photo du document en vous assurant que l’image est nette, sans reflet et que toutes les informations sont clairement visibles.",
              instructionEn:
                "The document is incomplete in the photo, or it is not fully visible. Please upload a photo of the document, ensuring the image is sharp, without glare, and all information is clearly visible.",
              logNoteFr: "Carte d'assurance maladie incomplète",
            },
            {
              id: "ramq_maj",
              labelFr: "Mise à jour du document",
              labelEn: "Document update",
              instructionFr:
                "Pour la réouverture de votre dossier, nous aurons besoin que vous téléversiez la version la plus à jours de ce document dans votre portail du postulant.",
              instructionEn:
                "For the reopening of your file, we will need you to upload the most up-to-date version of this document to your applicant portal.",
              logNoteFr: "Mise à jour de la carte d'assurance maladie",
            },
          ],
        },
        {
          nameFr: "Passeport",
          nameEn: "Passport",
          reasons: [
            {
              id: "pass_floue",
              labelFr: "Floue / illisible",
              labelEn: "Blurred / Illegible",
              instructionFr:
                "Votre pièce d’identité est floue et illisible. Veuillez prendre une nouvelle photo et la téléverser à nouveau. Assurez vous que l’image est nette, sans reflet et que toutes les informations sont clairement visibles.",
              instructionEn:
                "Your ID is blurred and illegible. Please take a new photo and upload it again. Ensure the image is sharp, without glare, and all information is clearly visible.",
              logNoteFr: "Pièce d'identité floue",
            },
            {
              id: "pass_expire",
              labelFr: "Expiré",
              labelEn: "Expired",
              instructionFr:
                "Votre passeport est expiré. Veuillez téléverser une version valide ou une autre pièce d’identité officielle d’un gouvernement canadien. (permis de conduire, carte d'assurance maladie, etc…)",
              instructionEn:
                "Your passport is expired. Please upload a valid version or another official Canadian government ID (driver's license, health insurance card, etc.).",
              logNoteFr: "Pièce d'identité expirée",
            },
            {
              id: "pass_noir_blanc",
              labelFr: "Noir et blanc",
              labelEn: "Black and white",
              instructionFr:
                "Le document fourni n'est pas valide car il est en noir et blanc. Veuillez fournir une photo couleur du même document.",
              instructionEn:
                "The provided document is invalid because it is in black and white. Please provide a color photo of the same document.",
              logNoteFr: "Pièce d'identité en noir et blanc",
            },
            {
              id: "pass_incomplet",
              labelFr: "Document incomplet sur la photo",
              labelEn: "Incomplete document in the photo",
              instructionFr:
                "Le document est incomplet sur la photo, le document n’est pas totalement visible. Veuillez téléverser une photo du document en vous assurant que l’image est nette, sans reflet et que toutes les informations sont clairement visibles.",
              instructionEn:
                "The document is incomplete in the photo, or it is not fully visible. Please upload a photo of the document, ensuring the image is sharp, without glare, and all information is clearly visible.",
              logNoteFr: "Passeport incomplet",
            },
            {
              id: "pass_maj",
              labelFr: "Mise à jour du document",
              labelEn: "Document update",
              instructionFr:
                "Pour la réouverture de votre dossier, nous aurons besoin que vous téléversiez la version la plus à jours de ce document dans votre portail du postulant.",
              instructionEn:
                "For the reopening of your file, we will need you to upload the most up-to-date version of this document to your applicant portal.",
              logNoteFr: "Mise à jour du passeport",
            },
          ],
        },
        {
          nameFr: "Autre pièce d'identité officiel",
          nameEn: "Other Official ID",
          reasons: [
            {
              id: "autre_floue",
              labelFr: "Floue / illisible",
              labelEn: "Blurred / Illegible",
              instructionFr:
                "Le document est floue et illisible. Veuillez prendre une nouvelle photo et la téléverser à nouveau. Assurez vous que l’image est nette, sans reflet et que toutes les informations sont clairement visibles.",
              instructionEn:
                "The document is blurred and illegible. Please take a new photo and upload it again. Ensure the image is sharp, without glare, and all information is clearly visible.",
              logNoteFr: "Pièce d'identité floue",
            },
            {
              id: "autre_expire",
              labelFr: "Expiré",
              labelEn: "Expired",
              instructionFr:
                "Votre pièce d’identité est expiré. Veuillez téléverser une version valide ou une autre pièce d’identité officielle d’un gouvernement canadien. (permis de conduire, carte d'assurance maladie, passeport, etc…)",
              instructionEn:
                "Your ID is expired. Please upload a valid version or another official Canadian government ID (driver's license, health insurance card, passport, etc.).",
              logNoteFr: "Pièce d'identité expirée",
            },
            {
              id: "autre_verso",
              labelFr: "Verso manquant",
              labelEn: "Back side missing",
              instructionFr:
                "Le verso du document est manquant; veuillez téléverser les deux côtés.",
              instructionEn:
                "The back of the document is missing; please upload both sides.",
              logNoteFr: "Verso manquant de la pièce d'identité",
            },
            {
              id: "autre_non_officiel",
              labelFr: "Non officiel",
              labelEn: "Unofficial",
              instructionFr:
                "Ce document n'est pas reconnu par le gouvernement fédéral comme pièce d'identité principale officielle. Veuillez téléverser une autre pièce d’identité avec photo émise par un gouvernement provincial ou fédéral canadien (ex: permis de conduire, carte d'assurance maladie provinciale, passeport canadien ou étranger).",
              instructionEn:
                "This document is not recognized by the federal government. Please upload another official Canadian government ID (driver's license, health insurance card, passport, etc.).",
              logNoteFr:
                "La pièce d'identité au dossier n'est pas acceptée comme pièce officielle",
            },
            {
              id: "autre_noir_blanc",
              labelFr: "Noir et blanc",
              labelEn: "Black and white",
              instructionFr:
                "Le document fourni n'est pas valide car il est en noir et blanc. Veuillez fournir une photo couleur du même document.",
              instructionEn:
                "The provided document is invalid because it is in black and white. Please provide a color photo of the same document.",
              logNoteFr: "Pièce d'identité en noir et blanc",
            },
            {
              id: "autre_incomplet",
              labelFr: "Document incomplet sur la photo",
              labelEn: "Incomplete document in the photo",
              instructionFr:
                "Le document est incomplet sur la photo, le document n’est pas totalement visible. Veuillez téléverser une photo du document en vous assurant que l’image est nette, sans reflet et que toutes les informations sont clairement visibles.",
              instructionEn:
                "The document is incomplete in the photo, or it is not fully visible. Please upload a photo of the document, ensuring the image is sharp, without glare, and all information is clearly visible.",
              logNoteFr: "Pièce d'identité incomplète",
            },
            {
              id: "autre_maj",
              labelFr: "Mise à jour du document",
              labelEn: "Document update",
              instructionFr:
                "Pour la réouverture de votre dossier, nous aurons besoin que vous téléversiez la version la plus à jours de ce document dans votre portail du postulant.",
              instructionEn:
                "For the reopening of your file, we will need you to upload the most up-to-date version of this document to your applicant portal.",
              logNoteFr: "Mise à jour de la pièce d'identité",
            },
          ],
        },
        {
          nameFr: "Document n'est pas une pièce d'identité valide",
          nameEn: "Document is not a valid ID",
          reasons: [
            {
              id: "id_invalide_autre",
              labelFr: "Autre document (non accepté)",
              labelEn: "Other document (not accepted)",
              instructionFr:
                "Ce document n'est pas une pièce d'identité valide. Veuillez téléverser une pièce d’identité officielle d’un gouvernement canadien (permis de conduire, carte d'assurance maladie, passeport).",
              instructionEn:
                "This document is not a valid ID. Please upload an official Canadian government ID (driver's license, health insurance card, passport).",
              logNoteFr:
                "Document soumis n'est pas une pièce d'identité valide",
            },
            {
              id: "id_invalide_rp",
              labelFr: "Carte de résident permanent",
              labelEn: "Permanent Resident Card",
              instructionFr:
                "La carte de résident permanent prouve votre statut, mais n'est pas acceptée comme pièce d'identité principale avec photo pour cette étape spécifique. Veuillez téléverser une autre pièce d’identité avec photo émise par un gouvernement provincial ou fédéral (ex: permis de conduire, carte d'assurance maladie provinciale, passeport canadien ou étranger).",
              instructionEn:
                "The Permanent Resident Card is not accepted as an ID for this step. Please upload a photo ID issued by a provincial or federal government (e.g., driver's license, health insurance card, passport).",
              logNoteFr:
                "La carte de résident permanent n'est pas une pièce d'identité acceptée.",
            },
          ],
        },
      ],
    },
    {
      nameFr:
        "Certificat de naissance canadien ou preuve de citoyenneté canadienne - statut de résident permanent",
      nameEn: "Canadian Birth Certificate or Proof of Citizenship - PR Status",
      documents: [
        {
          nameFr: "Certificat de naissance",
          nameEn: "Birth Certificate",
          reasons: [
            {
              id: "naiss_floue",
              labelFr: "Floue / illisible",
              labelEn: "Blurred / Illegible",
              instructionFr:
                "La photo de votre certificat de naissance est trop floue pour être lue. Veuillez reprendre une nouvelle photo en vous assurant que toutes les informations soient visibles et lisibles. Retournez ensuite sur votre portail en ligne pour y téléverser la nouvelle photo.",
              instructionEn:
                "The photo of your birth certificate is too blurry to be read. Please take a new photo, making sure all information is visible and legible. Then return to your online portal to upload the new photo.",
              logNoteFr: "Cerificat de naissance flou",
            },
            {
              id: "naiss_parents",
              labelFr: "Noms des parents absents",
              labelEn: "Parents' names missing",
              instructionFr:
                "Aucun document officiel au dossier ne mentionne vos parents ou tuteurs légaux. Veuillez envoyer, en réponse à ce courriel, un document prouvant le lien de parenté avec la personne ayant complété la tâche de consentement du parent -tuteur. (Exemple de document officiel : certificat de naissance version long)",
              instructionEn:
                "No official document in the file mentions your parents or legal guardians. Please reply to this email with a document proving the relationship with the person who completed the Parent/Guardian Consent task (e.g., long-form birth certificate).",
              logNoteFr:
                "Postulant mineur et le certificat de naissance ne comporte pas le nom des parents",
            },
            {
              id: "naiss_incomplet",
              labelFr: "Document incomplet sur la photo",
              labelEn: "Incomplete document in the photo",
              instructionFr:
                "Le document est incomplet sur la photo, le document n’est pas totalement visible. Veuillez téléverser une photo du document en vous assurant que l’image est nette, sans reflet et que toutes les informations sont clairement visibles.",
              instructionEn:
                "The document is incomplete in the photo, or it is not fully visible. Please upload a photo of the document, ensuring the image is sharp, without glare, and all information is clearly visible.",
              logNoteFr: "Certificat de naissance incomplet",
            },
            {
              id: "naiss_photocopie",
              labelFr: "Photocopie",
              labelEn: "Photocopy",
              instructionFr:
                "La photocopie de votre certificat de naissance n'est pas acceptée (un document original est exigé). Vous devez prendre une photo de votre document original et téléverser cette photo sur votre portail en ligne. Assurez-vous que l'image est nette et sans reflet.",
              instructionEn:
                "The photocopy of the birth certificate makes it invalid. You must take a photo of your document and upload this photo to your online portal. Ensure the image is sharp, without glare, and all information is clearly visible.",
              logNoteFr: "Certificat de naissance est une photocopie",
            },
            {
              id: "naiss_maj",
              labelFr: "Mise à jour du document",
              labelEn: "Document update",
              instructionFr:
                "Pour la réouverture de votre dossier, nous aurons besoin que vous téléversiez la version la plus à jours de ce document dans votre portail du postulant.",
              instructionEn:
                "For the reopening of your file, we will need you to upload the most up-to-date version of this document to your applicant portal.",
              logNoteFr: "Mise à jour du certificat de naissance",
            },
          ],
        },
        {
          nameFr: "Certificat de citoyenneté",
          nameEn: "Citizenship Certificate",
          reasons: [
            {
              id: "cit_floue",
              labelFr: "Floue / illisible",
              labelEn: "Blurred / Illegible",
              instructionFr:
                "Le document est floue et illisible. Veuillez prendre une nouvelle photo et la téléverser à nouveau. Assurez vous que l’image est nette, sans reflet et que toutes les informations sont clairement visibles.",
              instructionEn:
                "The document is blurred and illegible. Please take a new photo and upload it again. Ensure the image is sharp, without glare, and all information is clearly visible.",
              logNoteFr: "Certificat de citoyenneté flou",
            },
            {
              id: "cit_p1",
              labelFr: "Manque la page 1",
              labelEn: "Missing page 1",
              instructionFr:
                "Nous n’avons pas la première page de votre certificat de citoyenneté. Veuillez téléverser une photo de cette page.",
              linkFr: "Voici un lien vers un exemple de la <a href=\"https://simontheriault8-cyber.github.io/Documents/Certificat%20de%20citoyennet%C3%A9%20page%201.png\">page 1 du certificat de citoyenneté</a>.",
              instructionEn:
                "We do not have the first page of your citizenship certificate. Please upload a photo of this page.",
              linkEn: "Here is a link to an example of <a href=\"https://simontheriault8-cyber.github.io/Documents/Certificat%20de%20citoyennet%C3%A9%20page%201.png\">page 1 of the citizenship certificate</a>.",
              logNoteFr:
                "Il manque la première page du certificat de citoyenneté",
            },
            {
              id: "cit_p2",
              labelFr: "Manque la page 2",
              labelEn: "Missing page 2",
              instructionFr:
                "Nous n’avons pas la deuxième page de votre certificat de citoyenneté. Veuillez téléverser une photo de cette page.",
              linkFr: "Voici un lien vers un exemple de la <a href=\"https://simontheriault8-cyber.github.io/Documents/Certificat%20de%20citoyennet%C3%A9%20page%202.png\">page 2 du certificat de citoyenneté</a>.",
              instructionEn:
                "We do not have the second page of your citizenship certificate. Please upload a photo of this page.",
              linkEn: "Here is a link to an example of <a href=\"https://simontheriault8-cyber.github.io/Documents/Certificat%20de%20citoyennet%C3%A9%20page%202.png\">page 2 of the citizenship certificate</a>.",
              logNoteFr:
                "Il manque la deuxième page du certificat de citoyenneté",
            },
            {
              id: "cit_incomplet",
              labelFr: "Document incomplet sur la photo",
              labelEn: "Incomplete document in the photo",
              instructionFr:
                "Le document est incomplet sur la photo, il manque des pages ou le document n’est pas totalement visible. Veuillez téléverser une photo complète du document en vous assurant que l’image est nette, sans reflet et que toutes les informations sont clairement visibles.",
              instructionEn:
                "The document is incomplete in the photo, pages are missing, or it is not fully visible. Please upload a full photo of the document, ensuring the image is sharp, without glare, and all information is clearly visible.",
              logNoteFr: "Certificat de citoyenneté incomplet",
            },
            {
              id: "cit_maj",
              labelFr: "Mise à jour du document",
              labelEn: "Document update",
              instructionFr:
                "Pour la réouverture de votre dossier, nous aurons besoin que vous téléversiez la version la plus à jours de ce document dans votre portail du postulant.",
              instructionEn:
                "For the reopening of your file, we will need you to upload the most up-to-date version of this document to your applicant portal.",
              logNoteFr: "Mise à jour du certificat de citoyenneté",
            },
          ],
        },
        {
          nameFr: "Carte de citoyenneté",
          nameEn: "Citizenship Card",
          reasons: [
            {
              id: "cc_floue",
              labelFr: "Floue / illisible",
              labelEn: "Blurred / Illegible",
              instructionFr:
                "Le document est floue et illisible. Veuillez prendre une nouvelle photo et la téléverser à nouveau. Assurez vous que l’image est nette, sans reflet et que toutes les informations sont clairement visibles.",
              instructionEn:
                "The document is blurred and illegible. Please take a new photo and upload it again. Ensure the image is sharp, without glare, and all information is clearly visible.",
              logNoteFr: "Carte de citoyenneté floue",
            },
            {
              id: "cc_verso",
              labelFr: "Verso manquant",
              labelEn: "Back side missing",
              instructionFr:
                "Le verso du document est manquant; veuillez téléverser une photo du verso de votre carte de citoyenneté.",
              instructionEn:
                "The back of the document is missing; please upload a photo of the back of your citizenship card.",
              logNoteFr: "Verso manquant de la carte de citoyenneté",
            },
            {
              id: "cc_incomplet",
              labelFr: "Document incomplet sur la photo",
              labelEn: "Incomplete document in the photo",
              instructionFr:
                "Le document est incomplet sur la photo, le document n’est pas totalement visible. Veuillez téléverser une photo du document en vous assurant que l’image est nette, sans reflet et que toutes les informations sont clairement visibles.",
              instructionEn:
                "The document is incomplete in the photo, or it is not fully visible. Please upload a photo of the document, ensuring the image is sharp, without glare, and all information is clearly visible.",
              logNoteFr: "Carte de citoyenneté incomplète",
            },
            {
              id: "cc_maj",
              labelFr: "Mise à jour du document",
              labelEn: "Document update",
              instructionFr:
                "Pour la réouverture de votre dossier, nous aurons besoin que vous téléversiez la version la plus à jours de ce document dans votre portail du postulant.",
              instructionEn:
                "For the reopening of your file, we will need you to upload the most up-to-date version of this document to your applicant portal.",
              logNoteFr: "Mise à jour de la carte de citoyenneté",
            },
          ],
        },
        {
          nameFr: "Carte de résident permanent",
          nameEn: "Permanent Resident Card",
          reasons: [
            {
              id: "pr_floue",
              labelFr: "Floue / illisible",
              labelEn: "Blurred / Illegible",
              instructionFr:
                "Le document est floue et illisible. Veuillez prendre une nouvelle photo et la téléverser à nouveau. Assurez vous que l’image est nette, sans reflet et que toutes les informations sont clairement visibles.",
              instructionEn:
                "The document is blurred and illegible. Please take a new photo and upload it again. Ensure the image is sharp, without glare, and all information is clearly visible.",
              logNoteFr: "Carte de résident permanent floue",
            },
            {
              id: "pr_expire",
              labelFr: "Expiré",
              labelEn: "Expired",
              instructionFr:
                "Votre carte de résident permanent est expiré. Veuillez téléverser une version valide ou un certificat de citoyenneté.",
              instructionEn:
                "Your permanent resident card is expired. Please upload a valid version or a citizenship certificate.",
              logNoteFr: "Carte de résident permanent expirée",
            },
            {
              id: "pr_verso",
              labelFr: "Verso manquant",
              labelEn: "Missing back side",
              instructionFr:
                "Il manque le verso de la carte. Vous devez téléverser une copie des deux côtés du document.",
              instructionEn:
                "The back side of the card is missing. You must upload a copy of both sides of the document.",
              logNoteFr: "Verso manquant de la carte de résident permanent",
            },
            {
              id: "pr_incomplet",
              labelFr: "Document incomplet sur la photo",
              labelEn: "Incomplete document in the photo",
              instructionFr:
                "Le document est incomplet sur la photo, le document n’est pas totalement visible. Veuillez téléverser une photo du document en vous assurant que l’image est nette, sans reflet et que toutes les informations sont clairement visibles.",
              instructionEn:
                "The document is incomplete in the photo, or it is not fully visible. Please upload a photo of the document, ensuring the image is sharp, without glare, and all information is clearly visible.",
              logNoteFr: "Carte de résident permanent incomplète",
            },
            {
              id: "pr_maj",
              labelFr: "Mise à jour du document",
              labelEn: "Document update",
              instructionFr:
                "Pour la réouverture de votre dossier, nous aurons besoin que vous téléversiez la version la plus à jours de ce document dans votre portail du postulant.",
              instructionEn:
                "For the reopening of your file, we will need you to upload the most up-to-date version of this document to your applicant portal.",
              logNoteFr: "Mise à jour de la carte de résident permanent",
            },
          ],
        },
        {
          nameFr: "Document ne prouvant pas le statut de citoyenneté",
          nameEn: "Document does not prove citizenship status",
          reasons: [
            {
              id: "cit_invalide_passeport",
              labelFr: "Passeport",
              labelEn: "Passport",
              instructionFr:
                "Le passeport ne prouve pas la citoyenneté canadienne. Vous devez fournir soit un certificat de naissance d'une province canadienne, un certificat de citoyenneté, une carte de citoyenneté ou une carte de résident permanent.",
              instructionEn:
                "A passport does not prove Canadian citizenship. You must provide either a birth certificate from a Canadian province, a citizenship certificate, a citizenship card, or a permanent resident card.",
              logNoteFr:
                "Le passeport ne prouve pas la citoyenneté. Doit fournir un certificat de naissance, certificat/carte de citoyenneté ou carte RP",
            },
            {
              id: "cit_invalide_permis",
              labelFr: "Permis de conduire",
              labelEn: "Driver's license",
              instructionFr:
                "Le permis de conduire ne prouve pas la citoyenneté canadienne. Vous devez fournir soit un certificat de naissance d'une province canadienne, un certificat de citoyenneté, une carte de citoyenneté ou une carte de résident permanent.",
              instructionEn:
                "A driver's license does not prove Canadian citizenship. You must provide either a birth certificate from a Canadian province, a citizenship certificate, a citizenship card, or a permanent resident card.",
              logNoteFr:
                "Le permis de conduire ne prouve pas la citoyenneté. Doit fournir un certificat de naissance, certificat/carte de citoyenneté ou carte RP",
            },
            {
              id: "cit_invalide_ramq",
              labelFr: "Carte d'assurance maladie",
              labelEn: "Health insurance card",
              instructionFr:
                "La carte d'assurance maladie ne prouve pas la citoyenneté canadienne. Vous devez fournir soit un certificat de naissance d'une province canadienne, un certificat de citoyenneté, une carte de citoyenneté ou une carte de résident permanent.",
              instructionEn:
                "A health insurance card does not prove Canadian citizenship. You must provide either a birth certificate from a Canadian province, a citizenship certificate, a citizenship card, or a permanent resident card.",
              logNoteFr:
                "La carte d'assurance maladie ne prouve pas la citoyenneté. Doit fournir un certificat de naissance, certificat/carte de citoyenneté ou carte RP",
            },
            {
              id: "cit_invalide_acte_naissance",
              labelFr: "Copie d'acte de naissance",
              labelEn: "Statement of Live Birth",
              instructionFr:
                "La copie d'acte de naissance ne prouve pas la citoyenneté canadienne. Vous devez fournir soit un certificat de naissance d'une province canadienne, un certificat de citoyenneté, une carte de citoyenneté ou une carte de résident permanent.",
              instructionEn:
                "A Statement of Live Birth does not prove Canadian citizenship. You must provide either a birth certificate from a Canadian province, a citizenship certificate, a citizenship card, or a permanent resident card.",
              logNoteFr:
                "La copie d'acte de naissance ne prouve pas la citoyenneté. Doit fournir un certificat de naissance, certificat/carte de citoyenneté ou carte RP",
            },
            {
              id: "cit_invalide_confirmation_rp",
              labelFr: "Confirmation de résidence permanente",
              labelEn: "Confirmation of Permanent Residence",
              instructionFr:
                "La confirmation de résidence permanente n'est pas acceptée. Vous devez fournir votre carte de résident permanent.",
              instructionEn:
                "The Confirmation of Permanent Residence is not accepted. You must provide your Permanent Resident Card.",
              logNoteFr:
                "La confirmation de résidence permanente n'est pas acceptée. Doit fournir une carte de résident permanent.",
            },
            {
              id: "cit_invalide_naissance_etranger",
              labelFr: "Acte ou certificat de naissance étranger",
              labelEn: "Foreign birth certificate",
              instructionFr:
                "Le certificat ou acte de naissance étranger ne prouve pas votre statut de citoyenneté ou de résident permanent. Vous devez fournir soit un certificat de citoyenneté, une carte de citoyenneté ou une carte de résident permanent.",
              instructionEn:
                "A foreign birth certificate does not prove your citizenship or permanent resident status. You must provide either a citizenship certificate, a citizenship card, or a permanent resident card.",
              logNoteFr:
                "L'acte de naissance étranger ne prouve pas la citoyenneté. Doit fournir un certificat/carte de citoyenneté ou carte RP",
            },
            {
              id: "cit_invalide_visa",
              labelFr: "Visa",
              labelEn: "Visa",
              instructionFr:
                "Le visa ne prouve pas la citoyenneté canadienne ni le statut de résident permanent. Vous devez fournir soit un certificat de naissance d'une province canadienne, un certificat de citoyenneté, une carte de citoyenneté ou une carte de résident permanent.",
              instructionEn:
                "A visa does not prove Canadian citizenship or permanent resident status. You must provide either a birth certificate from a Canadian province, a citizenship certificate, a citizenship card, or a permanent resident card.",
              logNoteFr:
                "Le visa ne prouve pas la citoyenneté. Doit fournir un certificat de naissance, certificat/carte de citoyenneté ou carte RP",
            },
            {
              id: "cit_invalide_bapteme",
              labelFr: "Certificat de baptême ou copie de certificat de baptême",
              labelEn: "Baptism certificate or copy of baptism certificate",
              instructionFr:
                "Le certificat de baptême ou la copie de certificat de baptême ne prouve pas la citoyenneté canadienne. Vous devez fournir soit un certificat de naissance d'une province canadienne, un certificat de citoyenneté, une carte de citoyenneté ou une carte de résident permanent.",
              instructionEn:
                "A baptism certificate or copy of a baptism certificate does not prove Canadian citizenship. You must provide either a birth certificate from a Canadian province, a citizenship certificate, a citizenship card, or a permanent resident card.",
              logNoteFr:
                "Le certificat de baptême ne prouve pas la citoyenneté. Doit fournir un certificat de naissance, certificat/carte de citoyenneté ou carte RP",
            },
            {
              id: "cit_invalide_permis_travail",
              labelFr: "Permis de travail",
              labelEn: "Work permit",
              instructionFr:
                "Le permis de travail ne prouve pas la citoyenneté canadienne ni le statut de résident permanent. Vous devez fournir soit un certificat de naissance d'une province canadienne, un certificat de citoyenneté, une carte de citoyenneté ou une carte de résident permanent.",
              instructionEn:
                "A work permit does not prove Canadian citizenship or permanent resident status. You must provide either a birth certificate from a Canadian province, a citizenship certificate, a citizenship card, or a permanent resident card.",
              logNoteFr:
                "Le permis de travail ne prouve pas la citoyenneté. Doit fournir un certificat de naissance, certificat/carte de citoyenneté ou carte RP",
            },
            {
              id: "cit_invalide_asile",
              labelFr: "Avis de décision d'une demande d'asile",
              labelEn: "Notice of Decision on a Refugee Claim",
              instructionFr:
                "L'avis de décision d'une demande d'asile ne prouve pas la citoyenneté canadienne ni le statut de résident permanent. Vous devez fournir soit un certificat de naissance d'une province canadienne, un certificat de citoyenneté, une carte de citoyenneté ou une carte de résident permanent.",
              instructionEn:
                "The Notice of Decision on a refugee claim does not prove Canadian citizenship or permanent resident status. You must provide either a birth certificate from a Canadian province, a citizenship certificate, a citizenship card, or a permanent resident card.",
              logNoteFr:
                "L'avis de décision d'une demande d'asile ne prouve pas la citoyenneté. Doit fournir un certificat de naissance, certificat/carte de citoyenneté ou carte RP",
            },
          ],
        },
      ],
    },
    {
      nameFr: "Consentement du parent - tuteur",
      nameEn: "Parent / Guardian Consent",
      documents: [
        {
          nameFr: "Formulaire de demande d'emploi - Partie H",
          nameEn: "Employment Application Form - Part H",
          reasons: [
            {
              id: "emp_sig_parent",
              labelFr: "Aucune signature d'un parent",
              labelEn: "No parent signature",
              instructionFr:
                "La signature du parent ou tuteur légal est requise à la partie H pour les mineurs; veuillez demander à votre parent ou tuteur légal de compléter la tâche Consentement parental dans votre portail.",
              instructionEn:
                "Parent/legal guardian signature is required in Part H for minors; please ask your parent/legal guardian to complete the Parental Consent task in your portal.",
              logNoteFr:
                "Aucune signature d'un parent à la partie H du DND 2170",
            },
            {
              id: "emp_nom_parent",
              labelFr: "Nom du parent ne correspond pas",
              labelEn: "Parent name mismatch",
              instructionFr:
                "Le nom du parent indiqué à la partie H doit être identique à celui figurant sur votre certificat de naissance. Veuillez demander à votre parent de compléter la tâche Consentement du parent - tuteur. Si vous avez un tuteur, envoyez nous une preuve légale en répondant à ce courriel.",
              instructionEn:
                "The parent's name in Part H must be identical to the one on your birth certificate. Please ask your parent to complete the Parent/Guardian Consent task. If you have a guardian, send us legal proof by replying to this email.",
              logNoteFr:
                "La signature à la partie H du DND 2170 ne correspond pas aux noms des parent sur le certificat de naissance, vérification supplémentaire requise du consentement parental. Courriel pour qu'un parent contacte un centre de recrutement envoyé.",
            },
          ],
        },
        {
          nameFr: "Pièce d'identité du parent",
          nameEn: "Parent's ID",
          reasons: [
            {
              id: "par_id_floue",
              labelFr: "Floue / illisible",
              labelEn: "Blurred / Illegible",
              instructionFr:
                "Le document est floue et illisible. Veuillez prendre une nouvelle photo et la téléverser à nouveau. Assurez vous que l’image est nette, sans reflet et que toutes les informations sont clairement visibles.",
              instructionEn:
                "The document is blurred and illegible. Please take a new photo and upload it again. Ensure the image is sharp, without glare, and all information is clearly visible.",
              logNoteFr: "Pièce d’identité du parent ou tuteur légal floue",
            },
            {
              id: "par_id_expire",
              labelFr: "Expiré",
              labelEn: "Expired",
              instructionFr:
                "La pièce d’identité de votre parent ou tuteur légal est expiré. Veuillez téléverser une version valide ou une autre pièce d’identité officielle d’un gouvernement canadien. (permis de conduire, carte d'assurance maladie, passeport, etc…)",
              instructionEn:
                "Your parent's or legal guardian's ID is expired. Please upload a valid version or another official Canadian government ID (driver's license, health card, passport, etc.).",
              logNoteFr:
                "Pièce d’identité du parent ou tuteur légal est expirée",
            },
            {
              id: "par_id_inexist",
              labelFr: "Inexistant au dossier",
              labelEn: "Missing from file",
              instructionFr:
                "Le document n’est pas à votre dossier. Veuillez prendre une photo et la téléverser. Assurez vous que l’image est nette, sans reflet et que toutes les informations sont clairement visibles.",
              instructionEn:
                "The document is not in your file. Please take a photo and upload it. Ensure the image is sharp, without glare, and all information is clearly visible.",
              logNoteFr:
                "Aucune pièce d’identité du parent ou tuteur légal n’est au dossier",
            },
            {
              id: "par_id_maj",
              labelFr: "Mise à jour du document",
              labelEn: "Document update",
              instructionFr:
                "Pour la réouverture de votre dossier, nous aurons besoin que vous téléversiez la version la plus à jours de ce document dans votre portail du postulant.",
              instructionEn:
                "For the reopening of your file, we will need you to upload the most up-to-date version of this document to your applicant portal.",
              logNoteFr: "Mise à jour de la pièce d'identité du parent",
            },
          ],
        },
        {
          nameFr: "Égoportrait (Selfie) du parent avec pièce d'identité",
          nameEn: "Parent Selfie with ID",
          reasons: [
            {
              id: "par_selfie_floue",
              labelFr: "Floue / illisible",
              labelEn: "Blurred / Illegible",
              instructionFr:
                "La photo de votre parent ou tuteur légal et de sa pièce d’identité est floue et illisible. Veuillez prendre une nouvelle photo et la téléverser à nouveau. Assurez vous que l’image est nette, sans reflet et que toutes les informations sont clairement visibles.",
              linkFr: "Voici le lien vers un exemple d'<a href=\"https://simontheriault8-cyber.github.io/Documents/%C3%89goportrait.png\">égoportrait</a> acceptable.",
              instructionEn:
                "The photo of your parent or legal guardian and their ID is blurred and illegible. Please take a new photo and upload it again. Ensure the image is sharp, without glare, and all information is clearly visible.",
              linkEn: "Here is a link to an acceptable example of a <a href=\"https://simontheriault8-cyber.github.io/Documents/%C3%89goportrait.png\">selfie</a>.",
              logNoteFr:
                "Photo du parent ou tuteur légal tenant sa pièce d’identité floue",
            },
            {
              id: "par_selfie_mauvais",
              labelFr: "Mauvaise pièce d’identité",
              labelEn: "Wrong ID",
              instructionFr:
                "La pièce d'identité tenue ne correspond pas à celle soumise au dossier. Veuillez téléverser une nouvelle photo de votre parent ou tuteur légal et de sa pièce d’identité soumise au dossier.",
              linkFr: "Voici le lien vers un exemple d'<a href=\"https://simontheriault8-cyber.github.io/Documents/%C3%89goportrait.png\">égoportrait</a> acceptable.",
              instructionEn:
                "The ID held does not match the one submitted to the file. Please upload a new photo of your parent or legal guardian holding the ID submitted to the file.",
              linkEn: "Here is a link to an acceptable example of a <a href=\"https://simontheriault8-cyber.github.io/Documents/%C3%89goportrait.png\">selfie</a>.",
              logNoteFr:
                "Photo du parent ou tuteur légal tenant une mauvaise pièce d’identité",
            },
            {
              id: "par_selfie_inexist",
              labelFr: "Inexistant au dossier",
              labelEn: "Missing from file",
              instructionFr:
                "La photo ne se trouve pas dans votre dossier, veuillez prendre un égoportrait (selfie) de votre parent avec sa pièce d'identité qui est dans votre dossier et téléverser cette photo sur votre portail en ligne. Il doit tenir la pièce d'identité près de son visage de façon à ce que son visage et sa pièce d'identité soit clair et lisible.",
              linkFr: "Voici le lien vers un exemple d'<a href=\"https://simontheriault8-cyber.github.io/Documents/%C3%89goportrait.png\">égoportrait</a> acceptable.",
              instructionEn:
                "The photo is not in your file, please take a selfie of your parent with their identity document that is in your file and upload this photo to your online portal. They must hold the identity document near their face so that their face and identity document are clear and legible.",
              linkEn: "Here is a link to an acceptable example of a <a href=\"https://simontheriault8-cyber.github.io/Documents/%C3%89goportrait.png\">selfie</a>.",
              logNoteFr:
                "Aucune photo du parent ou tuteur légal tenant sa pièce d’identité n’est au dossier",
            },
            {
              id: "par_selfie_maj",
              labelFr: "Mise à jour du document",
              labelEn: "Document update",
              instructionFr:
                "Pour la réouverture de votre dossier, nous aurons besoin que vous téléversiez la version la plus à jours de ce document dans votre portail du postulant.",
              instructionEn:
                "For the reopening of your file, we will need you to upload the most up-to-date version of this document to your applicant portal.",
              logNoteFr: "Mise à jour de l'égoportrait (Selfie) du parent",
            },
          ],
        },
        {
          nameFr: "Document inacceptable",
          nameEn: "Unacceptable document",
          reasons: [
            {
              id: "parent_doc_invalide",
              labelFr: "Mauvais document soumis",
              labelEn: "Wrong document submitted",
              instructionFr:
                "Le document soumis n'est pas approprié pour le consentement parental. Veuillez soumettre le formulaire complété et signé, ou la pièce d'identité du parent, selon ce qui est requis.",
              instructionEn:
                "The submitted document is not appropriate for parental consent. Please submit the completed and signed form, or the parent's ID, as required.",
              logNoteFr:
                "Document soumis n'est pas valide pour le consentement parental",
            },
          ],
        },
      ],
    },
    {
      nameFr: "MDN 2977 - Formulaire de vérification de sécurité",
      nameEn: "DND 2977 - Security Screening Form",
      documents: [
        {
          nameFr: "DND 2977",
          nameEn: "DND 2977",
          reasons: [
            {
              id: "sec_expire",
              labelFr: "Expiré",
              labelEn: "Expired",
              instructionFr:
                "Le formulaire de vérification de sécurité (MDN 2977) est expiré. Veuillez le compléter à nouveau dans votre portail.",
              instructionEn:
                "The security clearance form (DND 2977) has expired. Please complete it again in your portal.",
              logNoteFr: "DND 2977 expiré",
            },
            {
              id: "sec_incomp",
              labelFr: "Incomplet",
              labelEn: "Incomplete",
              instructionFr:
                "Le formulaire est incomplet. Veuillez le compléter à nouveau dans votre portail.",
              instructionEn:
                "The form is incomplete. Please complete it again in your portal.",
              logNoteFr: "DND 2977 incomplet",
            },
            {
              id: "sec_inexist",
              labelFr: "Inexistant au dossier",
              labelEn: "Missing from file",
              instructionFr:
                "Le document n’est pas à votre dossier. Veuillez retourner dans votre portail et le compléter.",
              instructionEn:
                "The document is not in your file. Please return to your portal and complete it.",
              logNoteFr: "Aucun DND 2977 au dossier",
            },
          ],
        },
        {
          nameFr: "Document inacceptable",
          nameEn: "Unacceptable document",
          reasons: [
            {
              id: "sec_doc_invalide",
              labelFr: "Mauvais document soumis",
              labelEn: "Wrong document submitted",
              instructionFr:
                "Le document soumis n'est pas le Formulaire de vérification de sécurité. Veuillez vous assurer de compléter ce formulaire dans votre portail.",
              instructionEn:
                "The submitted document is not the Security Screening Form. Please ensure you complete this form in your portal.",
              logNoteFr:
                "Mauvais document soumis à la place du formulaire de sécurité",
            },
          ],
        },
      ],
    },
    {
      nameFr:
        "Formulaire de demande d'emploi dans les Forces armées canadiennes",
      nameEn: "CAF Employment Application Form",
      documents: [
        {
          nameFr: "Formulaire de demande d'emploi",
          nameEn: "Employment Application Form",
          reasons: [
            {
              id: "emp_expire",
              labelFr: "Expiré",
              labelEn: "Expired",
              instructionFr:
                "Le formulaire de demande d'emploi est expiré. Veuillez le compléter à nouveau dans votre portail.",
              instructionEn:
                "The employment application form has expired. Please complete it again in your portal.",
              logNoteFr: "Formulaire de demande d'emploi expiré",
            },
            {
              id: "emp_incomp",
              labelFr: "Incomplet",
              labelEn: "Incomplete",
              instructionFr:
                "Le formulaire est incomplet. Veuillez le compléter à nouveau dans votre portail.",
              instructionEn:
                "The form is incomplete. Please complete it again in your portal.",
              logNoteFr: "DND 2170 incomplet",
            },
            {
              id: "emp_inexist",
              labelFr: "Inexistant au dossier",
              labelEn: "Missing from file",
              instructionFr:
                "Le document n’est pas à votre dossier. Veuillez retourner dans votre portail et le compléter.",
              instructionEn:
                "The document is not in your file. Please return to your portal and complete it.",
              logNoteFr: "Aucun DND2170 au dossier",
            },
            {
              id: "emp_sig_i",
              labelFr: "Signature manquante partie I",
              labelEn: "Missing signature Part I",
              instructionFr:
                "Vous devez signer la partie I et J ainsi que cocher la case de la partie J. Veuillez compléter le formulaire à nouveau dans votre portail.",
              linkFr: "Voici une image des parties que vous devez obligatoirement remplir : <a href=\"https://simontheriault8-cyber.github.io/Documents/DND%202170%20Partie%20I%20et%20J.png\">Formulaire de demande d'emploi dans les Forces armées canadiennes</a>.",
              instructionEn:
                "You must sign Parts I and J and check the box in Part J. Please complete the form again in your portal.",
              linkEn: "Here is an image of the parts you must complete: <a href=\"https://simontheriault8-cyber.github.io/Documents/DND%202170%20Partie%20I%20et%20J.png\">Canadian Armed Forces Employment Application Form</a>.",
              logNoteFr: "Manque la signature à la partie I du DND 2170",
            },
            {
              id: "emp_sig_j",
              labelFr: "Signature manquante partie J",
              labelEn: "Missing signature Part J",
              instructionFr:
                "Vous devez signer la partie I et J ainsi que cocher la case de la partie J. Veuillez compléter le formulaire à nouveau dans votre portail.",
              linkFr: "Voici une image des parties que vous devez obligatoirement remplir : <a href=\"https://simontheriault8-cyber.github.io/Documents/DND%202170%20Partie%20I%20et%20J.png\">Formulaire de demande d'emploi dans les Forces armées canadiennes</a>.",
              instructionEn:
                "You must sign Parts I and J and check the box in Part J. Please complete the form again in your portal.",
              linkEn: "Here is an image of the parts you must complete: <a href=\"https://simontheriault8-cyber.github.io/Documents/DND%202170%20Partie%20I%20et%20J.png\">Canadian Armed Forces Employment Application Form</a>.",
              logNoteFr: "Manque la signature à la partie J du DND 2170",
            },
            {
              id: "emp_case_j",
              labelFr: "Case non cochée partie J",
              labelEn: "Box unchecked Part J",
              instructionFr:
                "Vous devez signer la partie I et J ainsi que cocher la case de la partie J. Veuillez compléter le formulaire à nouveau dans votre portail.",
              linkFr: "Voici une image des parties que vous devez obligatoirement remplir : <a href=\"https://simontheriault8-cyber.github.io/Documents/DND%202170%20Partie%20I%20et%20J.png\">Formulaire de demande d'emploi dans les Forces armées canadiennes</a>.",
              instructionEn:
                "You must sign Parts I and J and check the box in Part J. Please complete the form again in your portal.",
              linkEn: "Here is an image of the parts you must complete: <a href=\"https://simontheriault8-cyber.github.io/Documents/DND%202170%20Partie%20I%20et%20J.png\">Canadian Armed Forces Employment Application Form</a>.",
              logNoteFr: "N'a pas coché la case à la partie J du DND 2170",
            },
          ],
        },
        {
          nameFr: "Document inacceptable",
          nameEn: "Unacceptable document",
          reasons: [
            {
              id: "emp_doc_invalide",
              labelFr: "Mauvais document soumis",
              labelEn: "Wrong document submitted",
              instructionFr:
                "Le document soumis n'est pas le Formulaire de demande d'emploi dans les Forces armées canadiennes. Veuillez vous assurer de compléter ce formulaire dans votre portail.",
              instructionEn:
                "The submitted document is not the CAF Employment Application Form. Please ensure you complete this form in your portal.",
              logNoteFr:
                "Mauvais document soumis à la place du formulaire de demande d'emploi",
            },
          ],
        },
      ],
    },
    {
      nameFr: "Formulaire de demande d'emploi notée",
      nameEn: "Rated Employment Application Form",
      documents: [
        {
          nameFr: "Formulaire de demande d’emploi noté",
          nameEn: "Rated Employment App Form",
          reasons: [
            {
              id: "seaf_incomp",
              labelFr: "Incomplet",
              labelEn: "Incomplete",
              instructionFr:
                "Le formulaire est incomplet. Veuillez le compléter à nouveau dans votre portail.",
              instructionEn:
                "The form is incomplete. Please complete it again in your portal.",
              logNoteFr: "SEAF incomplet",
            },
            {
              id: "seaf_inexist",
              labelFr: "Inexistant au dossier",
              labelEn: "Missing from file",
              instructionFr:
                "Le document n’est pas à votre dossier. Veuillez retourner dans votre portail et le compléter.",
              instructionEn:
                "The document is not in your file. Please return to your portal and complete it.",
              logNoteFr: "Aucun SEAF au dossier",
            },
            {
              id: "seaf_no_res",
              labelFr: "Tâche complétée sans résultat",
              labelEn: "Task completed without result",
              instructionFr:
                "La tâche apparaît comme complétée mais aucun résultat n'est enregistré. Veuillez compléter la tâche à nouveau dans votre portail.",
              instructionEn:
                "The task appears as completed, but no result is recorded. Please complete the task again in your portal.",
              logNoteFr:
                "Le SEAF a été complété mais il n'y a pas de résultat au dossier",
            },
            {
              id: "seaf_maj",
              labelFr: "Mise à jour du document",
              labelEn: "Document update",
              instructionFr:
                "Pour la réouverture de votre dossier, vous devez refaire le formulaire de demande d'emploi notée puisque votre score peux changer selon votre expérience dans la vie. Veuillez vous rendre sur votre portail du postulant afin de le compléter.",
              instructionEn:
                "For the reopening of your file, you must redo the rated employment application form as your score may change based on your life experience. Please go to your applicant portal to complete it.",
              logNoteFr: "Mise à jour du formulaire de demande d'emploi notée",
            },
          ],
        },
        {
          nameFr: "Document inacceptable",
          nameEn: "Unacceptable document",
          reasons: [
            {
              id: "seaf_doc_invalide",
              labelFr: "Mauvais document soumis",
              labelEn: "Wrong document submitted",
              instructionFr:
                "Le document soumis n'est pas une évaluation valide. Veuillez compléter la tâche dans votre portail.",
              instructionEn:
                "The submitted document is not a valid assessment. Please complete the task in your portal.",
              logNoteFr: "Mauvais document soumis pour l'évaluation",
            },
          ],
        },
      ],
    },
    {
      nameFr:
        "Évaluation de la personnalité (Inventaire de personnalité des traits auto-descriptifs)",
      nameEn: "Personality Assessment (TSD-PI)",
      documents: [
        {
          nameFr: "Évaluation de la personnalité",
          nameEn: "Personality Assessment",
          reasons: [
            {
              id: "pers_incomp",
              labelFr: "Incomplet",
              labelEn: "Incomplete",
              instructionFr:
                "Le formulaire est incomplet. Veuillez le compléter à nouveau dans votre portail.",
              instructionEn:
                "The form is incomplete. Please complete it again in your portal.",
              logNoteFr: "IP-TAD incomplet",
            },
            {
              id: "pers_inexist",
              labelFr: "Inexistant au dossier",
              labelEn: "Missing from file",
              instructionFr:
                "Le document n’est pas à votre dossier. Veuillez retourner dans votre portail et le compléter.",
              instructionEn:
                "The document is not in your file. Please return to your portal and complete it.",
              logNoteFr: "Aucun IP-TAD au dossier",
            },
            {
              id: "pers_no_res",
              labelFr: "Tâche complétée sans résultat",
              labelEn: "Task completed without result",
              instructionFr:
                "La tâche apparaît comme complétée mais aucun résultat n'est enregistré. Veuillez compléter la tâche à nouveau dans votre portail.",
              instructionEn:
                "The task appears as completed, but no result is recorded. Please complete the task again in your portal.",
              logNoteFr:
                "L'IP-TAD a été complété mais il n'y a pas de résultat au dossier",
            },
          ],
        },
        {
          nameFr: "Document inacceptable",
          nameEn: "Unacceptable document",
          reasons: [
            {
              id: "pers_doc_invalide",
              labelFr: "Mauvais document soumis",
              labelEn: "Wrong document submitted",
              instructionFr:
                "Le document soumis n'est pas une évaluation valide. Veuillez compléter la tâche dans votre portail.",
              instructionEn:
                "The submitted document is not a valid assessment. Please complete the task in your portal.",
              logNoteFr: "Mauvais document soumis pour l'évaluation",
            },
          ],
        },
      ],
    },
    {
      nameFr: "Questionnaire sur les médicaments en vente libre",
      nameEn: "Over-the-Counter Medication Questionnaire",
      documents: [
        {
          nameFr: "Questionnaire sur les médicaments",
          nameEn: "Medication Questionnaire",
          reasons: [
            {
              id: "med_expire",
              labelFr: "Expiré",
              labelEn: "Expired",
              instructionFr:
                "Le questionnaire sur les médicaments est expiré. Veuillez compléter un nouveau questionnaire dans votre portail.",
              instructionEn:
                "The medication questionnaire has expired. Please complete a new questionnaire in your portal.",
              logNoteFr: "Questionnaire sur les médicaments expiré",
            },
            {
              id: "med_incomp",
              labelFr: "Incomplet",
              labelEn: "Incomplete",
              instructionFr:
                "Le formulaire est incomplet. Veuillez le compléter à nouveau dans votre portail.",
              instructionEn:
                "The form is incomplete. Please complete it again in your portal.",
              logNoteFr: "QD mal rempli",
            },
            {
              id: "med_inexist",
              labelFr: "Inexistant au dossier",
              labelEn: "Missing from file",
              instructionFr:
                "Le document n’est pas à votre dossier. Veuillez retourner dans votre portail et le compléter.",
              instructionEn:
                "The document is not in your file. Please return to your portal and complete it.",
              logNoteFr: "Aucun QD au dossier",
            },
            {
              id: "med_no_res",
              labelFr: "Tâche complétée sans résultat",
              labelEn: "Task completed without result",
              instructionFr:
                "La tâche apparaît comme complétée mais aucun résultat n'est enregistré. Veuillez compléter la tâche à nouveau dans votre portail.",
              instructionEn:
                "The task appears as completed, but no result is recorded. Please complete the task again in your portal.",
              logNoteFr:
                "Le tâche du QD est complétée mais il n'y a pas de résultat au dossier",
            },
            {
              id: "med_prescrits",
              labelFr: "Médicaments prescrits inclus",
              labelEn: "Prescribed medications included",
              instructionFr:
                "Ce formulaire est réservé aux médicaments en vente libre (sans ordonnance). Veuillez retirer tout médicament prescrit par un médecin et soumettre le formulaire à nouveau.",
              instructionEn:
                "This form is reserved for over-the-counter (non-prescription) medications. Please remove any medication prescribed by a doctor and submit the form again.",
              logNoteFr:
                "Médicaments prescrits inscrits dans le questionnaire sur les médicaments en vente libre",
            },
          ],
        },
        {
          nameFr: "Document inacceptable",
          nameEn: "Unacceptable document",
          reasons: [
            {
              id: "med_doc_invalide",
              labelFr: "Mauvais document soumis",
              labelEn: "Wrong document submitted",
              instructionFr:
                "Le document soumis n'est pas le questionnaire sur les médicaments. Veuillez compléter la tâche dans votre portail.",
              instructionEn:
                "The submitted document is not the medication questionnaire. Please complete the task in your portal.",
              logNoteFr:
                "Mauvais document soumis pour le questionnaire sur les médicaments",
            },
          ],
        },
      ],
    },
    {
      nameFr: "Questionnaire médical - DND 4585",
      nameEn: "Medical Questionnaire - DND 4585",
      documents: [
        {
          nameFr: "Questionnaire médical - DND 4585",
          nameEn: "Medical Questionnaire - DND 4585",
          reasons: [
            {
              id: "medq_inexist",
              labelFr: "Inexistant au dossier",
              labelEn: "Missing from file",
              instructionFr:
                "Le document n’est pas à votre dossier. Veuillez retourner dans votre portail et le compléter.",
              instructionEn:
                "The document is not in your file. Please return to your portal and complete it.",
              logNoteFr: "Aucun questionnaire médical au dossier",
            },
          ],
        },
        {
          nameFr: "Document inacceptable",
          nameEn: "Unacceptable document",
          reasons: [
            {
              id: "medq_doc_invalide",
              labelFr: "Mauvais document soumis",
              labelEn: "Wrong document submitted",
              instructionFr:
                "Le document soumis n'est pas le questionnaire médical. Veuillez compléter la tâche dans votre portail.",
              instructionEn:
                "The submitted document is not the medical questionnaire. Please complete the task in your portal.",
              logNoteFr:
                "Mauvais document soumis pour le questionnaire médical",
            },
            {
              id: "medq_mauvais_format",
              labelFr: "Mauvais format de fichier",
              labelEn: "Wrong file format",
              instructionFr:
                "Le fichier soumis n'est pas dans un format accepté. Le seul format de fichier accepté pour le questionnaire médical est le format PDF. Veuillez convertir ou enregistrer votre document en format PDF et le téléverser à nouveau sur votre portail.",
              instructionEn:
                "The submitted file is not in an accepted format. The only accepted file format for the medical questionnaire is PDF. Please convert or save your document as a PDF and upload it again to your portal.",
              logNoteFr: "Mauvais format de fichier pour le questionnaire médical (doit être PDF)",
            },
          ],
        },
      ],
    },
    {
      nameFr: "Documents Supplémentaires",
      nameEn: "Additional Documents",
      documents: [
        {
          nameFr: "Curriculum vitae (CV)",
          nameEn: "Curriculum Vitae (CV)",
          reasons: [
            {
              id: "doc_supp_cv",
              labelFr: "Curriculum vitae (CV) récent à jour",
              labelEn: "Recent up-to-date Curriculum Vitae (CV)",
              instructionFr:
                "Veuillez nous fournir un Curriculum Vitae (CV) récent à jour en répondant à ce courriel.",
              instructionEn:
                "Please provide a recent up-to-date Curriculum Vitae (CV) by replying to this email.",
              logNoteFr: "CV récent à jour demandé",
              isAdditionalDoc: true,
            },
          ],
        },
        {
          nameFr: "Permis d'exercice / Licence professionnelle",
          nameEn: "Practice Permit / Professional License",
          reasons: [
            {
              id: "doc_supp_permis",
              labelFr: "Permis d'exercice ou licence professionnelle sans restriction",
              labelEn: "Unrestricted practice permit or professional license",
              instructionFr:
                "Veuillez nous fournir une copie de votre permis d'exercice ou licence professionnelle active et sans restriction en répondant à ce courriel.",
              instructionEn:
                "Please provide a copy of your active and unrestricted practice permit or professional license by replying to this email.",
              logNoteFr: "Permis d'exercice / licence professionnelle demandé",
              isAdditionalDoc: true,
            },
          ],
        },
        {
          nameFr: "Lettre de membre en règle",
          nameEn: "Good Standing Letter",
          reasons: [
            {
              id: "doc_supp_membre_regle",
              labelFr: "Lettre de l'autorité réglementaire attestant l'état « en règle »",
              labelEn: "Letter from regulatory body confirming 'good standing'",
              instructionFr:
                "Veuillez nous fournir une lettre officielle de votre ordre ou autorité réglementaire professionnelle attestant que vous êtes membre en règle en répondant à ce courriel.",
              instructionEn:
                "Please provide an official letter from your professional regulatory body confirming that you are a member in good standing by replying to this email.",
              logNoteFr: "Lettre de membre en règle demandée",
              isAdditionalDoc: true,
            },
          ],
        },
        {
          nameFr: "Certificat / Attestation de spécialité",
          nameEn: "Specialty Certificate / Attestation",
          reasons: [
            {
              id: "doc_supp_certificat_specialite",
              labelFr: "Certificat ou attestation officielle de spécialité (BNED, CCAMC, Collège Royal, etc.)",
              labelEn: "Official specialty certificate or attestation (NDEB, CACMS, Royal College, etc.)",
              instructionFr:
                "Veuillez nous fournir une attestation ou certificat officiel de votre spécialité médicale ou professionnelle en répondant à ce courriel.",
              instructionEn:
                "Please provide an official attestation or certificate of your medical or professional specialty by replying to this email.",
              logNoteFr: "Certificat de spécialité demandé",
              isAdditionalDoc: true,
            },
          ],
        },
        {
          nameFr: "Preuve d'expérience spécifique",
          nameEn: "Proof of Specific Experience",
          reasons: [
            {
              id: "doc_supp_preuve_experience",
              labelFr: "Preuve d'expérience spécifique (gestion, portfolio, accréditation)",
              labelEn: "Proof of specific experience (management, portfolio, accreditation)",
              instructionFr:
                "Veuillez nous fournir un document justificatif d'expérience ou d'accréditation spécifique requise pour votre profession en répondant à ce courriel.",
              instructionEn:
                "Please provide documentary proof of specific experience or accreditation required for your profession by replying to this email.",
              logNoteFr: "Preuve d'expérience spécifique demandée",
              isAdditionalDoc: true,
            },
          ],
        },
        {
          nameFr: "Relevés de notes à l'étranger",
          nameEn: "Foreign transcripts",
          reasons: [
            {
              id: "doc_supp_releves_etrangers",
              labelFr: "Relevé de notes officiel de l'établissement d'enseignement à l'étranger",
              labelEn: "Official foreign transcript",
              instructionFr:
                "Merci de nous avoir fourni votre évaluation comparative de vos études. Par contre, pour confirmer votre admissibilité académique aux métiers que vous avez choisis, nous aurons besoin de vos relevés de notes étrangers originaux s'ils sont écrits en français ou en anglais. Sinon, veuillez les faire traduire avant de nous les envoyer en répondant à ce courriel.",
              instructionEn:
                "Thank you for providing your comparative evaluation of your studies. However, to confirm your academic eligibility for the occupations you have chosen, we will need your original foreign transcripts if they are written in French or English. Otherwise, please have them translated before sending them to us by replying to this email.",
              logNoteFr:
                "Demande de relevés de notes étrangers",
              isAdditionalDoc: true,
            },
          ],
        },
        {
          nameFr: "Preuve de libération d'une armée étrangère",
          nameEn: "Proof of release from a foreign military",
          reasons: [
            {
              id: "doc_supp_liberation_armee_etrangere",
              labelFr: "Preuve de libération ou de fin de service d'une armée étrangère",
              labelEn: "Proof of release or end of service from a foreign military",
              instructionFr:
                "Vous devez fournir une preuve de libération ou de fin de service de l'armée étrangère. Veuillez envoyer cette preuve en répondant à ce courriel.",
              instructionEn:
                "You must provide proof of release or end of service from the foreign military. Please send this proof by replying to this email.",
              logNoteFr: "Preuve de libération d'une armée étrangère demandée",
              isAdditionalDoc: true,
            },
          ],
        },
        {
          nameFr: "Demande de service antérieur dans les Forces armées canadiennes",
          nameEn: "Prior service request in the Canadian Armed Forces",
          reasons: [
            {
              id: "doc_supp_service_anterieur_fac",
              labelFr: "Demande de vérification de service antérieur dans les Forces armées canadiennes",
              labelEn: "Request for verification of prior service in the Canadian Armed Forces",
              instructionFr:
                "Avez-vous du service antérieur dans les Forces armées canadiennes, que ce soit comme membre de la Régulière ou de la Réserve. Veuillez nous transmettre votre réponse directement en réponse à ce courriel.",
              instructionEn:
                "Do you have prior service in the Canadian Armed Forces, either as a member of the Regular Force or the Reserve? Please send us your answer by replying directly to this email.",
              logNoteFr: "Demande de vérification de service antérieur dans les FAC demandée",
              isAdditionalDoc: true,
            },
          ],
        },
        {
          nameFr: "Lettre d'admission dans un établissement scolaire",
          nameEn: "Letter of admission from an educational institution",
          reasons: [
            {
              id: "doc_subv_admission",
              labelFr: "Lettre d'admission officielle dans un établissement scolaire agréé",
              labelEn: "Official letter of admission from an accredited educational institution",
              instructionFr:
                "Veuillez nous fournir votre lettre d'admission officielle confirmant votre inscription dans un établissement scolaire agréé pour votre programme d'études subventionnées en répondant à ce courriel.",
              instructionEn:
                "Please provide your official letter of admission confirming your enrollment in an accredited educational institution for your subsidized study program by replying to this email.",
              logNoteFr: "Lettre d'admission dans un établissement scolaire demandée",
              isAdditionalDoc: true,
            },
          ],
        },
      ],
    },
  ];

  getGestionnaireTasks(): Task[] {
    return [
      // Réception d'un postulant
      {
        section: "Réception d'un postulant",
        nameFr: "Premier contact",
        nameEn: "First contact",
        documents: [],
      },
      {
        section: "Réception d'un postulant",
        nameFr: "Évaluation médicale",
        nameEn: "Medical evaluation",
        documents: [],
      },
      // Suivi de dossier
      {
        section: "Suivi de dossier",
        nameFr: "Avis de fermeture",
        nameEn: "Notice of file closure",
        documents: [],
      },
      // Retour PSPS
      {
        section: "Retour PSPS",
        nameFr: "Annexe Q",
        nameEn: "Annex Q",
        documents: [],
      },
      // Courriel d'offre
      {
        section: "Courriel d'offre",
        nameFr: "Offre normale",
        nameEn: "Standard offer",
        documents: [],
      },
      {
        section: "Courriel d'offre",
        nameFr: "Offre études subventionnées",
        nameEn: "Subsidized education offer",
        documents: [],
      },
      {
        section: "Courriel enrôlement",
        nameFr: "Rappel cérémonie d'assermentation",
        nameEn: "Swearing-in ceremony reminder",
        documents: [],
      },
    ];
  }

  getTasks(role: "recruiter" | "gestionnaire" = "recruiter"): Task[] {
    if (role === "gestionnaire") {
      return this.getGestionnaireTasks();
    }
    return this.data;
  }
}
