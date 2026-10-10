import { Injectable } from "@angular/core";

export interface EmailScenario {
  id: string;
  subjectFr: string;
  subjectEn: string;
  bodyHtml: string;
  bodyText: string;
}

@Injectable({
  providedIn: "root",
})
export class EmailScenariosService {
  private scenarios: Map<string, EmailScenario> = new Map();

  constructor() {
    this.initScenarios();
  }

  private initScenarios() {
    // SCENARIO: Parental Consent Required
    // Triggered by: 'naiss_parents' or 'emp_nom_parent'
    const parentalConsentHtml = `
      <div style="font-family: Calibri, sans-serif; font-size: 11pt; color: #000;">
        <p><span style="background-color: yellow;">English message will follow.</span></p>
        <p>Bonjour,</p>
        <p>Nous avons procédé à l'évaluation préliminaire de vos documents de candidature. <strong>Veuillez noter que ce courriel doit être consulté avec votre parent ou tuteur légal.</strong> Afin de compléter votre dossier, nous devons obtenir la confirmation du consentement parental. Sans cette validation, nous ne pouvons légalement traiter votre dossier. Voici les deux options qui s'offrent à vous :</p>
        <ul>
          <li><strong>OPTION 1 :</strong> Veuillez nous faire parvenir une copie de votre certificat de naissance « grand format » (celui incluant le nom des parents) <strong>en pièce jointe, directement en répondant à ce courriel.</strong></li>
          <li style="margin-top: 10px;"><strong>OPTION 2 :</strong> Le parent ou le tuteur signataire doit contacter un centre de recrutement des Forces canadiennes durant les heures d'ouverture. Il doit mentionner qu'il appelle afin de confirmer verbalement son consentement parental pour votre dossier.</li>
        </ul>
        <p>En raison du volume élevé de candidatures, nous devons prioriser le traitement des dossiers dont toutes les tâches sont complétées.</p>
        <p><strong>Si vous ne prenez aucune action, votre dossier sera désactivé automatiquement après 30 jours.</strong></p>
        <p>Cordialement,</p>
        <p>L’équipe de recrutement des Forces armées canadiennes<br>
        Centre de recrutement des Forces canadiennes Québec<br>
        Commandement du Personnel militaire / Forces armées canadiennes<br>
        <a href="https://forces.ca/fr/centre-dassistance/#/" target="_blank" class="text-blue-600 hover:underline" style="color: #2563eb; text-decoration: underline;">Centre d’assistance | Forces armées canadiennes</a></p>
        
        <br><p>______________________________________________________________________________</p><br>

        <p>Hello,</p>
        <p>We have conducted a preliminary evaluation of your application documents. <strong>Please note that this email must be reviewed with your parent or legal guardian.</strong></p>
        <p>To complete your file, we must obtain confirmation of parental consent. Without this validation, we cannot legally process your file. Here are the two options available to you:</p>
        <ul>
          <li><strong>OPTION 1:</strong> Please provide a copy of your "long-form" birth certificate (the one listing parents' names) as an attachment, by replying directly to this email.</li>
          <li style="margin-top: 10px;"><strong>OPTION 2:</strong> The signing parent or legal guardian must contact a Canadian Forces Recruiting Centre during business hours. They must state that they are calling to verbally confirm their parental consent for your application.</li>
        </ul>
        <p>Due to the high volume of applications, we must prioritize the processing of files where all tasks are complete.</p>
        <p><strong>If you do not take any action, your file will be automatically deactivated after 30 days.</strong></p>
        <p>Sincerely,</p>
        <p>The Canadian Armed Forces Recruiting Team<br>
        Canadian Forces Recruiting Centre Quebec<br>
        Military Personnel Command / Canadian Armed Forces<br>
        <a href="https://forces.ca/en/help-centre/#/" target="_blank" class="text-blue-600 hover:underline" style="color: #2563eb; text-decoration: underline;">Help Centre | Canadian Armed Forces</a></p>
      </div>
    `;

    const parentalConsentText = `English message will follow.

Bonjour,

Nous avons procédé à l'évaluation préliminaire de vos documents de candidature. Veuillez noter que ce courriel doit être consulté avec votre parent ou tuteur légal. Afin de compléter votre dossier, nous devons obtenir la confirmation du consentement parental. Sans cette validation, nous ne pouvons légalement traiter votre dossier. Voici les deux options qui s'offrent à vous :

• OPTION 1 : Veuillez nous faire parvenir une copie de votre certificat de naissance « grand format » (celui incluant le nom des parents) en pièce jointe, directement en répondant à ce courriel.

• OPTION 2 : Le parent ou le tuteur signataire doit contacter un centre de recrutement des Forces canadiennes durant les heures d'ouverture. Il doit mentionner qu'il appelle afin de confirmer verbalement son consentement parental pour votre dossier.

En raison du volume élevé de candidatures, nous devons prioriser le traitement des dossiers dont toutes les tâches sont complétées.

Si vous ne prenez aucune action, votre dossier sera désactivé automatiquement après 30 jours.

Cordialement,

L’équipe de recrutement des Forces armées canadiennes
Centre de recrutement des Forces canadiennes Québec
Commandement du Personnel militaire / Forces armées canadiennes
Centre d’assistance | Forces armées canadiennes

______________________________________________________________________________

Hello,

We have conducted a preliminary evaluation of your application documents. Please note that this email must be reviewed with your parent or legal guardian.

To complete your file, we must obtain confirmation of parental consent. Without this validation, we cannot legally process your file. Here are the two options available to you:

• OPTION 1: Please provide a copy of your "long-form" birth certificate (the one listing parents' names) as an attachment, by replying directly to this email.

• OPTION 2: The signing parent or legal guardian must contact a Canadian Forces Recruiting Centre during business hours. They must state that they are calling to verbally confirm their parental consent for your application.

Due to the high volume of applications, we must prioritize the processing of files where all tasks are complete.

If you do not take any action, your file will be automatically deactivated after 30 days.

Sincerely,

The Canadian Armed Forces Recruiting Team
Canadian Forces Recruiting Centre Quebec
Military Personnel Command / Canadian Armed Forces
Help Centre | Canadian Armed Forces`;

    this.scenarios.set("parental_consent_required", {
      id: "parental_consent_required",
      subjectFr: "Forces armées canadiennes/Canadian Armed Forces",
      subjectEn: "Forces armées canadiennes/Canadian Armed Forces",
      bodyHtml: parentalConsentHtml,
      bodyText: parentalConsentText,
    });

    // SCENARIO: General Reminder
    const generalReminderHtml = `
      <div style="font-family: Calibri, sans-serif; font-size: 11pt; color: #000;">
        <p><span style="background-color: yellow;">English message will follow.</span></p>
        <p>Bonjour,</p>
        <p>Il vous reste des tâches à compléter sur votre portail de recrutement.</p>
        <p>Veuillez noter que nous attendons que vous complétiez ces tâches avant de pouvoir continuer le traitement de votre dossier.</p>
        <p>En raison du volume élevé de candidatures, nous devons prioriser le traitement des dossiers dont toutes les tâches sont complétées.</p>
        <p>Rendez-vous sur votre portail pour les compléter : <a href="https://www.cafoap-pclfac.forces.gc.ca/">https://www.cafoap-pclfac.forces.gc.ca/</a></p>
        <p><strong>Si vous ne prenez aucune action, votre dossier sera désactivé automatiquement après 30 jours.</strong></p>
        <p>Cordialement,</p>
        <p>L’équipe de recrutement des Forces armées canadiennes<br>
        Centre de recrutement des Forces canadiennes Québec<br>
        Commandement du Personnel militaire / Forces armées canadiennes<br>
        <a href="https://forces.ca/fr/centre-dassistance/#/" target="_blank" class="text-blue-600 hover:underline" style="color: #2563eb; text-decoration: underline;">Centre d’assistance | Forces armées canadiennes</a></p>
        
        <br><p>______________________________________________________________________________</p><br>

        <p>Hello,</p>
        <p>You have pending tasks to complete on your recruiting portal.</p>
        <p>Please note that we are waiting for you to complete these tasks before we can continue processing your file.</p>
        <p>Due to the high volume of applications, we must prioritize the processing of files where all tasks are complete.</p>
        <p>Please log in to your portal to complete them: <a href="https://www.cafoap-pclfac.forces.gc.ca/">https://www.cafoap-pclfac.forces.gc.ca/</a></p>
        <p><strong>If you do not take any action, your file will be automatically deactivated after 30 days.</strong></p>
        <p>Sincerely,</p>
        <p>The Canadian Armed Forces Recruiting Team<br>
        Canadian Forces Recruiting Centre Quebec<br>
        Military Personnel Command / Canadian Armed Forces<br>
        <a href="https://forces.ca/en/help-centre/#/" target="_blank" class="text-blue-600 hover:underline" style="color: #2563eb; text-decoration: underline;">Help Centre | Canadian Armed Forces</a></p>
      </div>
    `;

    const generalReminderText = `English message will follow.

Bonjour,

Il vous reste des tâches à compléter sur votre portail de recrutement.

Veuillez noter que nous attendons que vous complétiez ces tâches avant de pouvoir continuer le traitement de votre dossier.

En raison du volume élevé de candidatures, nous devons prioriser le traitement des dossiers dont toutes les tâches sont complétées.

Rendez-vous sur votre portail pour les compléter : https://www.cafoap-pclfac.forces.gc.ca/

Si vous ne prenez aucune action, votre dossier sera désactivé automatiquement après 30 jours.

Cordialement,

L’équipe de recrutement des Forces armées canadiennes
Centre de recrutement des Forces canadiennes Québec
Commandement du Personnel militaire / Forces armées canadiennes
Centre d’assistance | Forces armées canadiennes

______________________________________________________________________________

Hello,

You have pending tasks to complete on your recruiting portal.

Please note that we are waiting for you to complete these tasks before we can continue processing your file.

Due to the high volume of applications, we must prioritize the processing of files where all tasks are complete.

Please log in to your portal to complete them: https://www.cafoap-pclfac.forces.gc.ca/

If you do not take any action, your file will be automatically deactivated after 30 days.

Sincerely,

The Canadian Armed Forces Recruiting Team
Canadian Forces Recruiting Centre Quebec
Military Personnel Command / Canadian Armed Forces
Help Centre | Canadian Armed Forces`;

    this.scenarios.set("general_reminder", {
      id: "general_reminder",
      subjectFr: "Forces armées canadiennes/Canadian Armed Forces",
      subjectEn: "Forces armées canadiennes/Canadian Armed Forces",
      bodyHtml: generalReminderHtml,
      bodyText: generalReminderText,
    });

    // SCENARIO: File closed due to basic academic requirements
    const fileClosedAcademicsHtml = `
      <div style="font-family: Calibri, sans-serif; font-size: 11pt; color: #000;">
        <p><span style="background-color: yellow;">English message will follow.</span></p>
        <p>Bonjour,</p>
        <p>L’évaluation des documents que vous avez fournis nous indique que vous n’êtes pas admissible à un enrôlement au sein des Forces armées canadiennes.</p>
        <p>Voici les 3 façons de répondre au critère d’entrée académique minimum :</p>
        <ul>
          <li>24 crédits de secondaire 4 ou 5 (les crédits de formation professionnelle ne sont pas acceptés dans le calcul)</li>
          <li>Diplôme d’étude professionnelles (DEP) complété.</li>
          <li>Attestation d’études de niveau secondaire (AENS)</li>
        </ul>
        <p><em>Remarque : La réussite du Test de développement général (TDG) n’est pas acceptée.</em></p>
        <p>Voici un lien qui pourrait vous être utile : <a href="https://www.challengeu.ca/">ChallengeU - Plateforme en ligne - Formation à distance</a></p>
        <p>Pour les études faites à l’étranger, communiquez avec un des six membres de l'Alliance canadienne des services d'évaluation de diplômes afin d’obtenir le rapport d’étude comparative avant de nous recontacter afin que nous puissions valider vos acquis scolaires.</p>
        <p>Pour obtenir de l’information additionnelle à ce sujet, consultez les liens suivants :</p>
        <ul>
          <li><a href="http://www.cicdi.ca">www.cicdi.ca</a></li>
          <li><a href="https://canalliance.org/">https://canalliance.org/</a></li>
        </ul>
        <p>Pour le moment vous ne répondez pas au critère d’entré académique minimum. Par conséquent, nous devons malheureusement procéder à la fermeture de votre dossier de candidature.</p>
        <p>Si vous répondez à ces critères un jour, vous devez appeler un centre de recrutement pour poursuivre votre demande d’enrôlement.</p>
        <p>Nous vous remercions de votre intérêt envers les Forces armées canadiennes et vous souhaitons du succès dans vos projets futurs.</p>
        <p><strong>Si vous ne prenez aucune action, votre dossier sera désactivé automatiquement après 30 jours.</strong></p>
        <p>Cordialement,</p>
        <p>L’équipe de recrutement des Forces armées canadiennes<br>
        Centre de recrutement des Forces canadiennes Québec<br>
        Commandement du Personnel militaire / Forces armées canadiennes<br>
        <a href="https://forces.ca/fr/centre-dassistance/#/" target="_blank" class="text-blue-600 hover:underline" style="color: #2563eb; text-decoration: underline;">Centre d’assistance | Forces armées canadiennes</a></p>
        
        <br><p>______________________________________________________________________________</p><br>

        <p>Hello,</p>
        <p>The evaluation of the documents you provided indicates that you are not eligible for enrollment in the Canadian Armed Forces.</p>
        <p>Here are the 3 ways to meet the minimum academic entry requirement:</p>
        <ul>
          <li>24 credits of Secondary 4 or 5 (vocational training credits are not accepted in the calculation)</li>
          <li>Completed Diploma of Vocational Studies (DVS)</li>
          <li>Secondary School Equivalency Attestation (TENS)</li>
        </ul>
        <p><em>Note: Successful completion of the General Development Test (GDT) is not accepted.</em></p>
        <p>Here is a link that might be useful: <a href="https://www.challengeu.ca/">ChallengeU - Online Platform - Distance Learning</a></p>
        <p>For studies completed abroad, please contact one of the six members of the Canadian Alliance of Credential Evaluation Services to obtain a comparative evaluation report before contacting us again so we can validate your educational background.</p>
        <p>For additional information on this subject, please consult the following links:</p>
        <ul>
          <li><a href="http://www.cicdi.ca">www.cicdi.ca</a></li>
          <li><a href="https://canalliance.org/">https://canalliance.org/</a></li>
        </ul>
        <p>At the moment you do not meet the minimum academic entry requirement. Therefore, we must unfortunately close your application file.</p>
        <p>If you meet these criteria in the future, you must contact a recruiting centre to pursue your enrollment application.</p>
        <p>We thank you for your interest in the Canadian Armed Forces and wish you success in your future endeavors.</p>
        <p><strong>If you do not take any action, your file will be automatically deactivated after 30 days.</strong></p>
        <p>Sincerely,</p>
        <p>The Canadian Armed Forces Recruiting Team<br>
        Canadian Forces Recruiting Centre Quebec<br>
        Military Personnel Command / Canadian Armed Forces<br>
        <a href="https://forces.ca/en/help-centre/#/" target="_blank" class="text-blue-600 hover:underline" style="color: #2563eb; text-decoration: underline;">Help Centre | Canadian Armed Forces</a></p>
      </div>
    `;

    const fileClosedAcademicsText = `English message will follow.

Bonjour,

L’évaluation des documents que vous avez fournis nous indique que vous n’êtes pas admissible à un enrôlement au sein des Forces armées canadiennes.

Voici les 3 façons de répondre au critère d’entrée académique minimum :
- 24 crédits de secondaire 4 ou 5 (les crédits de formation professionnelle ne sont pas acceptés dans le calcul)
- Diplôme d’étude professionnelles (DEP) complété.
- Attestation d’études de niveau secondaire (AENS)

Remarque : La réussite du Test de développement général (TDG) n’est pas acceptée.

Voici un lien qui pourrait vous être utile : ChallengeU - Plateforme en ligne - Formation à distance (https://www.challengeu.ca/)

Pour les études faites à l’étranger, communiquez avec un des six membres de l'Alliance canadienne des services d'évaluation de diplômes afin d’obtenir le rapport d’étude comparative avant de nous recontacter afin que nous puissions valider vos acquis scolaires.

Pour obtenir de l’information additionnelle à ce sujet, consultez les liens suivants :
- www.cicdi.ca
- https://canalliance.org/

Pour le moment vous ne répondez pas au critère d’entré académique minimum. Par conséquent, nous devons malheureusement procéder à la fermeture de votre dossier de candidature.

Si vous répondez à ces critères un jour, vous devez appeler un centre de recrutement pour poursuivre votre demande d’enrôlement.

Nous vous remercions de votre intérêt envers les Forces armées canadiennes et vous souhaitons du succès dans vos projets futurs.

Si vous ne prenez aucune action, votre dossier sera désactivé automatiquement après 30 jours.

Cordialement,

L’équipe de recrutement des Forces armées canadiennes
Centre de recrutement des Forces canadiennes Québec
Commandement du Personnel militaire / Forces armées canadiennes
Centre d’assistance | Forces armées canadiennes

______________________________________________________________________________

Hello,

The evaluation of the documents you provided indicates that you are not eligible for enrollment in the Canadian Armed Forces.

Here are the 3 ways to meet the minimum academic entry requirement:
- 24 credits of Secondary 4 or 5 (vocational training credits are not accepted in the calculation)
- Completed Diploma of Vocational Studies (DVS)
- Secondary School Equivalency Attestation (TENS)

Note: Successful completion of the General Development Test (GDT) is not accepted.

Here is a link that might be useful: ChallengeU - Online Platform - Distance Learning (https://www.challengeu.ca/)

For studies completed abroad, please contact one of the six members of the Canadian Alliance of Credential Evaluation Services to obtain a comparative evaluation report before contacting us again so we can validate your educational background.

For additional information on this subject, please consult the following links:
- www.cicdi.ca
- https://canalliance.org/

At the moment you do not meet the minimum academic entry requirement. Therefore, we must unfortunately close your application file.

If you meet these criteria in the future, you must contact a recruiting centre to pursue your enrollment application.

We thank you for your interest in the Canadian Armed Forces and wish you success in your future endeavors.

If you do not take any action, your file will be automatically deactivated after 30 days.

Sincerely,

The Canadian Armed Forces Recruiting Team
Canadian Forces Recruiting Centre Quebec
Military Personnel Command / Canadian Armed Forces
Help Centre | Canadian Armed Forces`;

    this.scenarios.set("educ_non_admissible", {
      id: "educ_non_admissible",
      subjectFr: "Forces armées canadiennes/Canadian Armed Forces",
      subjectEn: "Forces armées canadiennes/Canadian Armed Forces",
      bodyHtml: fileClosedAcademicsHtml,
      bodyText: fileClosedAcademicsText,
    });

    // SCENARIO: Verification Programme EDO VS PFOR
    const verificationEdoVsPforHtml = `
      <div style="font-family: Calibri, sans-serif; font-size: 11pt; color: #000;">
        <p><span style="background-color: yellow;">English message will follow.</span></p>
        <p>Bonjour,</p>
        <p>Selon les renseignements actuellement consignés à votre dossier, vous avez indiqué souhaiter vous enrôler dans les Forces armées canadiennes (FAC) à titre d’officier par l’entremise du programme Entrée directe comme officier (EDO).</p>
        <p>Veuillez noter que ce programme d’enrôlement exige la détention d’un baccalauréat. Or, à partir des informations et des documents présentement disponibles à votre dossier, nous ne sommes pas en mesure de confirmer que cette exigence est satisfaite. Il est possible que le diplôme requis n’ait pas encore été téléversé ou que certaines informations demeurent manquantes.</p>
        <p>Nous souhaitons donc valider avec vous que le programme d’enrôlement sélectionné correspond bien à votre intention. Si vous ne détenez pas actuellement un baccalauréat, il est possible que vous souhaitiez plutôt présenter votre candidature dans le cadre du Programme de formation des officiers de la régulière (PFOR). Ce programme permet aux candidats admissibles d'effectuer des études universitaires subventionnées en vue de l'obtention d'un baccalauréat tout en poursuivant un cheminement vers une carrière d'officier au sein des FAC.</p>
        <p>Nous vous demandons de répondre à ce courriel dans les meilleurs délais afin de confirmer le programme d’enrôlement souhaité. Le cas échéant, nous pourrons apporter les modifications nécessaires à votre dossier et poursuivre le traitement de votre demande en conséquence.</p>
        <p>Cordialement,</p>
        <p>L’équipe de recrutement des Forces armées canadiennes<br>
        Centre de recrutement des Forces canadiennes Québec<br>
        Commandement du Personnel militaire / Forces armées canadiennes<br>
        <a href="https://forces.ca/fr/centre-dassistance/#/" target="_blank" class="text-blue-600 hover:underline" style="color: #2563eb; text-decoration: underline;">Centre d’assistance | Forces armées canadiennes</a></p>
        
        <br><p>______________________________________________________________________________</p><br>

        <p>Hello,</p>
        <p>According to the information currently recorded in your file, you have indicated your intention to enroll in the Canadian Armed Forces (CAF) as an officer through the Direct Entry Officer (DEO) entry plan.</p>
        <p>Please note that this entry plan requires applicants to hold a bachelor's degree. Based on the information and documents currently available in your file, we are unable to confirm that this requirement has been met. It is possible that the required degree has not yet been uploaded to your file or that certain information is still missing.</p>
        <p>We would therefore like to confirm that the entry plan selected reflects your intended application pathway. If you do not currently hold a bachelor's degree, you may instead wish to apply through the Regular Officer Training Plan (ROTP). This program allows eligible applicants to pursue subsidized university studies leading to the completion of a bachelor's degree while working toward a career as an officer in the CAF.</p>
        <p>We ask that you reply to this email at your earliest convenience to confirm the entry plan you wish to pursue. If necessary, we will make the appropriate changes to your file and continue processing your application accordingly.</p>
        <p>Sincerely,</p>
        <p>The Canadian Armed Forces Recruiting Team<br>
        Canadian Forces Recruiting Centre Quebec<br>
        Military Personnel Command / Canadian Armed Forces<br>
        <a href="https://forces.ca/en/help-centre/#/" target="_blank" class="text-blue-600 hover:underline" style="color: #2563eb; text-decoration: underline;">Help Centre | Canadian Armed Forces</a></p>
      </div>
    `;

    const verificationEdoVsPforText = `English message will follow.

Bonjour,

Selon les renseignements actuellement consignés à votre dossier, vous avez indiqué souhaiter vous enrôler dans les Forces armées canadiennes (FAC) à titre d’officier par l’entremise du programme Entrée directe comme officier (EDO).

Veuillez noter que ce programme d’enrôlement exige la détention d’un baccalauréat. Or, à partir des informations et des documents présentement disponibles à votre dossier, nous ne sommes pas en mesure de confirmer que cette exigence est satisfaite. Il est possible que le diplôme requis n’ait pas encore été téléversé ou que certaines informations demeurent manquantes.

Nous souhaitons donc valider avec vous que le programme d’enrôlement sélectionné correspond bien à votre intention. Si vous ne détenez pas actuellement un baccalauréat, il est possible que vous souhaitiez plutôt présenter votre candidature dans le cadre du Programme de formation des officiers de la régulière (PFOR). Ce programme permet aux candidats admissibles d'effectuer des études universitaires subventionnées en vue de l'obtention d'un baccalauréat tout en poursuivant un cheminement vers une carrière d'officier au sein des FAC.

Nous vous demandons de répondre à ce courriel dans les meilleurs délais afin de confirmer le programme d’enrôlement souhaité. Le cas échéant, nous pourrons apporter les modifications nécessaires à votre dossier et poursuivre le traitement de votre demande en conséquence.

Cordialement,

L’équipe de recrutement des Forces armées canadiennes
Centre de recrutement des Forces canadiennes Québec
Commandement du Personnel militaire / Forces armées canadiennes
Centre d’assistance | Forces armées canadiennes

______________________________________________________________________________

Hello,

According to the information currently recorded in your file, you have indicated your intention to enroll in the Canadian Armed Forces (CAF) as an officer through the Direct Entry Officer (DEO) entry plan.

Please note that this entry plan requires applicants to hold a bachelor's degree. Based on the information and documents currently available in your file, we are unable to confirm that this requirement has been met. It is possible that the required degree has not yet been uploaded to your file or that certain information is still missing.

We would therefore like to confirm that the entry plan selected reflects your intended application pathway. If you do not currently hold a bachelor's degree, you may instead wish to apply through the Regular Officer Training Plan (ROTP). This program allows eligible applicants to pursue subsidized university studies leading to the completion of a bachelor's degree while working toward a career as an officer in the CAF.

We ask that you reply to this email at your earliest convenience to confirm the entry plan you wish to pursue. If necessary, we will make the appropriate changes to your file and continue processing your application accordingly.

Sincerely,

The Canadian Armed Forces Recruiting Team
Canadian Forces Recruiting Centre Quebec
Military Personnel Command / Canadian Armed Forces
Help Centre | Canadian Armed Forces`;

    this.scenarios.set("verification_edo_vs_pfor", {
      id: "verification_edo_vs_pfor",
      subjectFr: "Forces armées canadiennes/Canadian Armed Forces",
      subjectEn: "Forces armées canadiennes/Canadian Armed Forces",
      bodyHtml: verificationEdoVsPforHtml,
      bodyText: verificationEdoVsPforText,
    });

    // SCENARIO: Demande de documents - PFOR Université civile
    const demandeDocsPforCivilHtml = `
      <div style="font-family: Calibri, sans-serif; font-size: 11pt; color: #000;">
        <p><span style="background-color: yellow;">English version will follow</span></p>
        <p>Bonjour,</p>
        <p>À la suite de l’analyse préliminaire de votre dossier de candidature, il semble que vous souhaitez présenter une demande au <strong>Programme de formation des officiers de la Force régulière (PFOR)</strong> par l’entremise d’un établissement universitaire civil.</p>
        <p>Afin de poursuivre le traitement et l’évaluation de votre candidature, nous devons obtenir certains documents supplémentaires permettant de confirmer votre admissibilité au programme.</p>
        <p><strong>Afin de compléter l'évaluation de votre demande d'emploi, nous aurons besoin de document(s) supplémentaire(s) :</strong><br>
        • <strong>Lettre d'admission dans un établissement scolaire</strong><br>
        → Veuillez nous fournir votre lettre d'admission officielle sans conditions confirmant votre inscription ou une preuve de fréquentation dans un établissement scolaire agréé pour votre programme d'études subventionnées. Il doit être mentionné que vous étudier à temps plein et avoir la date de fin prévu de vos études.</p>
        <p>La réception de ce document est nécessaire pour permettre la poursuite de votre dossier et confirmer votre admissibilité au programme d’études subventionnées.</p>
        <p>En consultant le lien ci-dessous, vous trouverez la liste des programmes d’études admissibles selon les différents métiers offerts :</p>
        <p><a href="https://forces.ca/fr/programmes-admissibles/" target="_blank" class="text-blue-600 hover:underline" style="color: #2563eb; text-decoration: underline;">Liste des programmes admissibles par métier</a></p>
        <p>Si vous avez des questions concernant les documents requis ou le processus de candidature, n’hésitez pas à communiquer avec notre équipe. Nous demeurons disponibles pour vous accompagner tout au long de votre démarche.</p>
        <p>Cordialement,</p>
        <p>L’équipe de recrutement des Forces armées canadiennes<br>
        Centre de recrutement des Forces canadiennes Québec<br>
        Commandement du Personnel militaire / Forces armées canadiennes<br>
        <a href="https://forces.ca/fr/centre-dassistance/#/" target="_blank" class="text-blue-600 hover:underline" style="color: #2563eb; text-decoration: underline;">Centre d’assistance | Forces armées canadiennes</a></p>
        
        <br><p>______________________________________________________________________________</p><br>

        <p>Hello,</p>
        <p>Following the preliminary review of your application, it appears that you are interested in applying to the <strong>Regular Officer Training Plan (ROTP)</strong> through a civilian university program.</p>
        <p>In order to continue processing and evaluating your application, we require additional documentation to confirm your eligibility for the program.</p>
        <p><strong>In order to complete the evaluation of your employment application, we will need additional document(s):</strong><br>
        • <strong>Letter of admission from an educational institution</strong><br>
        → Please provide your official letter of admission without conditions confirming your enrollment or a proof of attendance in an accredited educational institution for your subsidized study program by replying to this email. The document must indicate that you are studying on a full-time basis and include the expected completion date of your studies.</p>
        <p>This documentation is required to allow us to proceed with the assessment of your application and confirm your eligibility for the subsidized education program.</p>
        <p>By following the link below, you will find a list of eligible academic programs associated with the various occupations available through the ROTP:</p>
        <p><a href="https://forces.ca/en/eligible-programmes/" target="_blank" class="text-blue-600 hover:underline" style="color: #2563eb; text-decoration: underline;">List of Eligible Programs by Occupation</a></p>
        <p>If you have any questions regarding the required documentation or the application process, please do not hesitate to contact us. We remain available to assist you throughout your application process.</p>
        <p>Sincerely,</p>
        <p>The Canadian Armed Forces Recruiting Team<br>
        Canadian Forces Recruiting Centre Quebec<br>
        Military Personnel Command / Canadian Armed Forces<br>
        <a href="https://forces.ca/en/help-centre/#/" target="_blank" class="text-blue-600 hover:underline" style="color: #2563eb; text-decoration: underline;">Help Centre | Canadian Armed Forces</a></p>
      </div>
    `;

    const demandeDocsPforCivilText = `English version will follow

Bonjour,

À la suite de l’analyse préliminaire de votre dossier de candidature, il semble que vous souhaitez présenter une demande au Programme de formation des officiers de la Force régulière (PFOR) par l’entremise d’un établissement universitaire civil.

Afin de poursuivre le traitement et l’évaluation de votre candidature, nous devons obtenir certains documents supplémentaires permettant de confirmer votre admissibilité au programme.

Afin de compléter l'évaluation de votre demande d'emploi, nous aurons besoin de document(s) supplémentaire(s) :
• Lettre d'admission dans un établissement scolaire
→ Veuillez nous fournir votre lettre d'admission officielle sans conditions confirmant votre inscription ou une preuve de fréquentation dans un établissement scolaire agréé pour votre programme d'études subventionnées. Il doit être mentionné que vous étudier à temps plein et avoir la date de fin prévu de vos études.

La réception de ce document est nécessaire pour permettre la poursuite de votre dossier et confirmer votre admissibilité au programme d’études subventionnées.

En consultant le lien ci-dessous, vous trouverez la liste des programmes d’études admissibles selon les différents métiers offerts :

Liste des programmes admissibles par métier (https://forces.ca/fr/programmes-admissibles/)

Si vous avez des questions concernant les documents requis ou le processus de candidature, n’hésitez pas à communiquer avec notre équipe. Nous demeurons disponibles pour vous accompagner tout au long de votre démarche.

Cordialement,

L’équipe de recrutement des Forces armées canadiennes
Centre de recrutement des Forces canadiennes Québec
Commandement du Personnel militaire / Forces armées canadiennes
Centre d’assistance | Forces armées canadiennes

______________________________________________________________________________

Hello,

Following the preliminary review of your application, it appears that you are interested in applying to the Regular Officer Training Plan (ROTP) through a civilian university program.

In order to continue processing and evaluating your application, we require additional documentation to confirm your eligibility for the program.

In order to complete the evaluation of your employment application, we will need additional document(s):
• Letter of admission from an educational institution
→ Please provide your official letter of admission without conditions confirming your enrollment or a proof of attendance in an accredited educational institution for your subsidized study program by replying to this email. The document must indicate that you are studying on a full-time basis and include the expected completion date of your studies.

This documentation is required to allow us to proceed with the assessment of your application and confirm your eligibility for the subsidized education program.

By following the link below, you will find a list of eligible academic programs associated with the various occupations available through the ROTP:

List of Eligible Programs by Occupation (https://forces.ca/en/eligible-programmes/)

If you have any questions regarding the required documentation or the application process, please do not hesitate to contact us. We remain available to assist you throughout your application process.

Sincerely,

The Canadian Armed Forces Recruiting Team
Canadian Forces Recruiting Centre Quebec
Military Personnel Command / Canadian Armed Forces
Help Centre | Canadian Armed Forces`;

    this.scenarios.set("demande_docs_pfor_civil", {
      id: "demande_docs_pfor_civil",
      subjectFr: "Forces armées canadiennes/Canadian Armed Forces",
      subjectEn: "Forces armées canadiennes/Canadian Armed Forces",
      bodyHtml: demandeDocsPforCivilHtml,
      bodyText: demandeDocsPforCivilText,
    });

    // SCENARIO: Inadmissibilité - Âge (57 ans et plus)
    const inadmissibiliteAge57Html = `
      <div style="font-family: Calibri, sans-serif; font-size: 11pt; color: #000;">
        <p><span style="background-color: yellow;">English message will follow.</span></p>
        <p>Bonjour,</p>
        <p>Suite à l’analyse de votre dossier de candidature, nous constatons que vous dépassez l’âge maximal d’admissibilité (56 ans) pour un enrôlement dans les Forces armées canadiennes (FAC). Toute personne ayant 57 ans ou plus est automatiquement inadmissible à un emploie dans les FAC.</p>
        <p>Votre dossier sera fermé.</p>
        <p>Merci de votre intérêt à joindre les Forces armées canadiennes!</p>
        <p>Cordialement,</p>
        <p>L’équipe de recrutement des Forces armées canadiennes<br>
        Centre de recrutement des Forces canadiennes Québec<br>
        Commandement du Personnel militaire / Forces armées canadiennes<br>
        <a href="https://forces.ca/fr/centre-dassistance/#/" target="_blank" class="text-blue-600 hover:underline" style="color: #2563eb; text-decoration: underline;">Centre d’assistance | Forces armées canadiennes</a></p>
        
        <br><p>______________________________________________________________________________</p><br>

        <p>Hello,</p>
        <p>Following the analysis of your application file, we have determined that you exceed the maximum eligibility age (56 years) for enrollment in the Canadian Armed Forces (CAF). Anyone aged 57 or older is automatically ineligible for employment in the CAF.</p>
        <p>Your file will be closed.</p>
        <p>Thank you for your interest in joining the Canadian Armed Forces!</p>
        <p>Sincerely,</p>
        <p>The Canadian Armed Forces Recruiting Team<br>
        Canadian Forces Recruiting Centre Quebec<br>
        Military Personnel Command / Canadian Armed Forces<br>
        <a href="https://forces.ca/en/help-centre/#/" target="_blank" class="text-blue-600 hover:underline" style="color: #2563eb; text-decoration: underline;">Help Centre | Canadian Armed Forces</a></p>
      </div>
    `;

    const inadmissibiliteAge57Text = `English message will follow.

Bonjour,

Suite à l’analyse de votre dossier de candidature, nous constatons que vous dépassez l’âge maximal d’admissibilité (56 ans) pour un enrôlement dans les Forces armées canadiennes (FAC). Toute personne ayant 57 ans ou plus est automatiquement inadmissible à un emploie dans les FAC.

Votre dossier sera fermé.

Merci de votre intérêt à joindre les Forces armées canadiennes!

Cordialement,

L’équipe de recrutement des Forces armées canadiennes
Centre de recrutement des Forces canadiennes Québec
Commandement du Personnel militaire / Forces armées canadiennes
Centre d’assistance | Forces armées canadiennes

______________________________________________________________________________

Hello,

Following the analysis of your application file, we have determined that you exceed the maximum eligibility age (56 years) for enrollment in the Canadian Armed Forces (CAF). Anyone aged 57 or older is automatically ineligible for employment in the CAF.

Your file will be closed.

Thank you for your interest in joining the Canadian Armed Forces!

Sincerely,

The Canadian Armed Forces Recruiting Team
Canadian Forces Recruiting Centre Quebec
Military Personnel Command / Canadian Armed Forces
Help Centre | Canadian Armed Forces`;

    this.scenarios.set("inadmissibilite_age_57", {
      id: "inadmissibilite_age_57",
      subjectFr: "Forces armées canadiennes/Canadian Armed Forces",
      subjectEn: "Forces armées canadiennes/Canadian Armed Forces",
      bodyHtml: inadmissibiliteAge57Html,
      bodyText: inadmissibiliteAge57Text,
    });

    // SCENARIO: Inadmissibilité - Résident permanent (< 3 ans)
    const inadmissibilitePr3ansHtml = `
      <div style="font-family: Calibri, sans-serif; font-size: 11pt; color: #000;">
        <p><span style="background-color: yellow;">English message will follow.</span></p>
        <p>Bonjour,</p>
        <p>Suite à l’analyse de votre dossier de candidature, nous constatons que vous êtes présentement inadmissible à un enrôlement dans les Forces armées canadiennes (FAC) sous le statut de résident permanent.</p>
        <p>Pour être admissible à un enrôlement dans les FAC à titre de résident permanent, vous devez avoir accumulé au moins trois ans (1 095 jours) de présence physique au Canada.</p>
        <p>Pour devenir admissible et pouvoir poser à nouveau votre candidature ou poursuivre votre processus à l'avenir, vous devez :</p>
        <ul style="padding-left: 20px; margin-top: 8px; margin-bottom: 16px;">
          <li><strong>Soit obtenir la citoyenneté canadienne ;</strong></li>
          <li><strong>Soit fournir le résultat officiel du calculateur de présence physique d'Immigration, Réfugiés et Citoyenneté Canada (IRCC)</strong> prouvant que vous avez accumulé plus de trois ans (1 095 jours) sur le territoire canadien.</li>
        </ul>
        <p>Puisque vous ne remplissez pas cette condition pour le moment, votre dossier de candidature actuel sera fermé. Dès que vous respecterez l'une de ces conditions, nous vous invitons à déposer une nouvelle candidature.</p>
        <p>Nous vous remercions sincèrement de votre intérêt envers les Forces armées canadiennes.</p>
        <p>Cordialement,</p>
        <p>L’équipe de recrutement des Forces armées canadiennes<br>
        Centre de recrutement des Forces canadiennes Québec<br>
        Commandement du Personnel militaire / Forces armées canadiennes<br>
        <a href="https://forces.ca/fr/centre-dassistance/#/" target="_blank" class="text-blue-600 hover:underline" style="color: #2563eb; text-decoration: underline;">Centre d’assistance | Forces armées canadiennes</a></p>
        
        <br><p>______________________________________________________________________________</p><br>

        <p>Hello,</p>
        <p>Following the analysis of your application file, we regret to inform you that you are currently ineligible for enrolment in the Canadian Armed Forces (CAF) under permanent resident status.</p>
        <p>To be eligible for enrolment in the CAF as a permanent resident, you must have accumulated at least three years (1,095 days) of physical presence in Canada.</p>
        <p>In order to become eligible and be able to reapply or proceed with an application in the future, you must:</p>
        <ul style="padding-left: 20px; margin-top: 8px; margin-bottom: 16px;">
          <li><strong>Either obtain Canadian citizenship;</strong></li>
          <li><strong>Or provide the official result from the Immigration, Refugees and Citizenship Canada (IRCC) physical presence calculator</strong> proving that you have accumulated more than three years (1,095 days) on Canadian territory.</li>
        </ul>
        <p>Since you do not meet this condition at this time, your current application file will be closed. As soon as you satisfy one of these requirements, you are welcome to submit a new application.</p>
        <p>Thank you for your interest in the Canadian Armed Forces.</p>
        <p>Sincerely,</p>
        <p>The Canadian Armed Forces Recruiting Team<br>
        Canadian Forces Recruiting Centre Quebec<br>
        Military Personnel Command / Canadian Armed Forces<br>
        <a href="https://forces.ca/en/help-centre/#/" target="_blank" class="text-blue-600 hover:underline" style="color: #2563eb; text-decoration: underline;">Help Centre | Canadian Armed Forces</a></p>
      </div>
    `;

    const inadmissibilitePr3ansText = `English message will follow.

Bonjour,

Suite à l’analyse de votre dossier de candidature, nous constatons que vous êtes présentement inadmissible à un enrôlement dans les Forces armées canadiennes (FAC) sous le statut de résident permanent.

Pour être admissible à un enrôlement dans les FAC à titre de résident permanent, vous devez avoir accumulé au moins trois ans (1 095 jours) de présence physique au Canada.

Pour devenir admissible et pouvoir poser à nouveau votre candidature ou poursuivre votre processus à l'avenir, vous devez :
  - Soit obtenir la citoyenneté canadienne ;
  - Soit fournir le résultat officiel du calculateur de présence physique d'Immigration, Réfugiés et Citoyenneté Canada (IRCC) prouvant que vous avez accumulé plus de trois ans (1 095 jours) sur le territoire canadien.

Puisque vous ne remplissez pas cette condition pour le moment, votre dossier de candidature actuel sera fermé. Dès que vous respecterez l'une de ces conditions, nous vous invitons à déposer une nouvelle candidature.

Nous vous remercions sincèrement de votre intérêt envers les Forces armées canadiennes.

Cordialement,

L’équipe de recrutement des Forces armées canadiennes
Centre de recrutement des Forces canadiennes Québec
Commandement du Personnel militaire / Forces armées canadiennes
Centre d’assistance | Forces armées canadiennes

______________________________________________________________________________

Hello,

Following the analysis of your application file, we regret to inform you that you are currently ineligible for enrolment in the Canadian Armed Forces (CAF) under permanent resident status.

To be eligible for enrolment in the CAF as a permanent resident, you must have accumulated at least three years (1,095 days) of physical presence in Canada.

In order to become eligible and be able to reapply or proceed with an application in the future, you must:
  - Either obtain Canadian citizenship;
  - Or provide the official result from the Immigration, Refugees and Citizenship Canada (IRCC) physical presence calculator proving that you have accumulated more than three years (1,095 days) on Canadian territory.

Since you do not meet this condition at this time, your current application file will be closed. As soon as you satisfy one of these requirements, you are welcome to submit a new application.

Thank you for your interest in the Canadian Armed Forces.

Sincerely,

The Canadian Armed Forces Recruiting Team
Canadian Forces Recruiting Centre Quebec
Military Personnel Command / Canadian Armed Forces
Help Centre | Canadian Armed Forces`;

    this.scenarios.set("inadmissibilite_pr_3ans", {
      id: "inadmissibilite_pr_3ans",
      subjectFr: "Forces armées canadiennes/Canadian Armed Forces",
      subjectEn: "Forces armées canadiennes/Canadian Armed Forces",
      bodyHtml: inadmissibilitePr3ansHtml,
      bodyText: inadmissibilitePr3ansText,
    });

    // SCENARIO: Inadmissibilité - Ni citoyen ni résident permanent
    const inadmissibiliteNonCitoyenNiPrHtml = `
      <div style="font-family: Calibri, sans-serif; font-size: 11pt; color: #000;">
        <p><span style="background-color: yellow;">English message will follow.</span></p>
        <p>Bonjour,</p>
        <p>Suite à l’analyse de votre dossier de candidature, nous constatons que vous n’êtes actuellement ni citoyen canadien ni résident permanent du Canada.</p>
        <p>Pour être admissible à un enrôlement au sein des Forces armées canadiennes (FAC), vous devez obligatoirement détenir la <strong>citoyenneté canadienne</strong> ou le statut de <strong>résident permanent</strong>. Les permis d'études, permis de travail, visas de visiteur ou demandes d'asile ne confèrent pas l'admissibilité requise pour s'enrôler.</p>
        <p>Par conséquent, nous devons procéder à la fermeture de votre dossier de candidature actuel.</p>
        <p>Dès que vous aurez obtenu la citoyenneté canadienne ou le statut de résident permanent (avec les critères de présence physique applicables), nous vous invitons à communiquer avec un centre de recrutement des Forces armées canadiennes afin de rouvrir votre dossier.</p>
        <p>Nous vous remercions de votre intérêt envers les Forces armées canadiennes et vous souhaitons du succès dans vos projets futurs.</p>
        <p>Cordialement,</p>
        <p>L’équipe de recrutement des Forces armées canadiennes<br>
        Centre de recrutement des Forces canadiennes Québec<br>
        Commandement du Personnel militaire / Forces armées canadiennes<br>
        <a href="https://forces.ca/fr/centre-dassistance/#/" target="_blank" class="text-blue-600 hover:underline" style="color: #2563eb; text-decoration: underline;">Centre d’assistance | Forces armées canadiennes</a></p>
        
        <br><p>______________________________________________________________________________</p><br>

        <p>Hello,</p>
        <p>Following the review of your application file, we have determined that you are currently neither a Canadian citizen nor a permanent resident of Canada.</p>
        <p>In order to be eligible for enrolment in the Canadian Armed Forces (CAF), you must hold either <strong>Canadian citizenship</strong> or <strong>permanent resident status</strong>. Study permits, work permits, visitor visas, or refugee/asylum claims do not provide the eligibility required to enroll.</p>
        <p>As a result, we must proceed with closing your current application file.</p>
        <p>Once you have obtained Canadian citizenship or permanent resident status (along with any applicable physical presence requirements), we invite you to contact a Canadian Armed Forces recruiting centre in order to reopen your file.</p>
        <p>Thank you for your interest in the Canadian Armed Forces, and we wish you success in your future endeavors.</p>
        <p>Sincerely,</p>
        <p>The Canadian Armed Forces Recruiting Team<br>
        Canadian Forces Recruiting Centre Quebec<br>
        Military Personnel Command / Canadian Armed Forces<br>
        <a href="https://forces.ca/en/help-centre/#/" target="_blank" class="text-blue-600 hover:underline" style="color: #2563eb; text-decoration: underline;">Help Centre | Canadian Armed Forces</a></p>
      </div>
    `;

    const inadmissibiliteNonCitoyenNiPrText = `English message will follow.

Bonjour,

Suite à l’analyse de votre dossier de candidature, nous constatons que vous n’êtes actuellement ni citoyen canadien ni résident permanent du Canada.

Pour être admissible à un enrôlement au sein des Forces armées canadiennes (FAC), vous devez obligatoirement détenir la citoyenneté canadienne ou le statut de résident permanent. Les permis d'études, permis de travail, visas de visiteur ou demandes d'asile ne confèrent pas l'admissibilité requise pour s'enrôler.

Par conséquent, nous devons procéder à la fermeture de votre dossier de candidature actuel.

Dès que vous aurez obtenu la citoyenneté canadienne ou le statut de résident permanent (avec les critères de présence physique applicables), nous vous invitons à communiquer avec un centre de recrutement des Forces armées canadiennes afin de rouvrir votre dossier.

Nous vous remercions de votre intérêt envers les Forces armées canadiennes et vous souhaitons du succès dans vos projets futurs.

Cordialement,

L’équipe de recrutement des Forces armées canadiennes
Centre de recrutement des Forces canadiennes Québec
Commandement du Personnel militaire / Forces armées canadiennes
Centre d’assistance | Forces armées canadiennes

______________________________________________________________________________

Hello,

Following the review of your application file, we have determined that you are currently neither a Canadian citizen nor a permanent resident of Canada.

In order to be eligible for enrolment in the Canadian Armed Forces (CAF), you must hold either Canadian citizenship or permanent resident status. Study permits, work permits, visitor visas, or refugee/asylum claims do not provide the eligibility required to enroll.

As a result, we must proceed with closing your current application file.

Once you have obtained Canadian citizenship or permanent resident status (along with any applicable physical presence requirements), we invite you to contact a Canadian Armed Forces recruiting centre in order to reopen your file.

Thank you for your interest in the Canadian Armed Forces, and we wish you success in your future endeavors.

Sincerely,

The Canadian Armed Forces Recruiting Team
Canadian Forces Recruiting Centre Quebec
Military Personnel Command / Canadian Armed Forces
Help Centre | Canadian Armed Forces`;

    this.scenarios.set("inadmissibilite_non_citoyen_ni_pr", {
      id: "inadmissibilite_non_citoyen_ni_pr",
      subjectFr: "Forces armées canadiennes/Canadian Armed Forces",
      subjectEn: "Forces armées canadiennes/Canadian Armed Forces",
      bodyHtml: inadmissibiliteNonCitoyenNiPrHtml,
      bodyText: inadmissibiliteNonCitoyenNiPrText,
    });
  }

  getScenario(id: string): EmailScenario | undefined {
    return this.scenarios.get(id);
  }
}
