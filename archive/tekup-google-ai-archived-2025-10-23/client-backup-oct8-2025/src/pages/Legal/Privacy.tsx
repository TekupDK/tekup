import { ArrowLeft, Shield, Lock, Eye, Database, AlertTriangle, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Privacy() {
    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-4xl mx-auto">
                {/* Back button */}
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
                    aria-label="Tilbage til forsiden"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Tilbage
                </Link>

                {/* Header */}
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <Shield className="w-10 h-10 text-primary" />
                        <h1 className="text-4xl font-bold text-foreground">
                            Privatlivspolitik
                        </h1>
                    </div>
                    <p className="text-muted-foreground">
                        Sidst opdateret: 6. oktober 2025
                    </p>
                    <p className="text-muted-foreground mt-2">
                        GDPR-compliant • Dansk lovgivning
                    </p>
                </div>

                {/* Content */}
                <div className="prose prose-slate dark:prose-invert max-w-none">

                    {/* Introduktion */}
                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                            <Eye className="w-6 h-6 text-primary" />
                            1. Introduktion
                        </h2>
                        <p className="text-muted-foreground leading-relaxed mb-4">
                            Denne privatlivspolitik beskriver, hvordan RenOS (Rendetalje Management System)
                            indsamler, bruger, og beskytter dine personoplysninger. Vi tager databeskyttelse
                            alvorligt og overholder fuldt ud EU's Generelle Forordning om Databeskyttelse (GDPR)
                            samt dansk databeskyttelseslovgivning.
                        </p>
                        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mt-4">
                            <p className="text-sm text-foreground font-medium mb-2">
                                🔒 Dataansvarlig
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Rendetalje er dataansvarlig for behandling af personoplysninger i RenOS systemet.
                            </p>
                        </div>
                    </section>

                    {/* Hvilke data indsamler vi */}
                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                            <Database className="w-6 h-6 text-primary" />
                            2. Hvilke Data Indsamler Vi?
                        </h2>

                        <div className="space-y-6">
                            {/* Brugerdata */}
                            <div className="bg-glass/30 border border-glass/50 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-foreground mb-3">
                                    2.1 Brugeroplysninger (Medarbejdere)
                                </h3>
                                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                                    <li>Navn og email-adresse</li>
                                    <li>Login-oplysninger (administreret af Clerk)</li>
                                    <li>Brugerroller og adgangsniveauer</li>
                                    <li>Login-tidspunkter og aktivitetslog</li>
                                </ul>
                                <p className="text-sm text-muted-foreground mt-3">
                                    <strong>Formål:</strong> Autentificering, adgangskontrol, systemsikkerhed
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    <strong>Retsgrundlag:</strong> Berettiget interesse (systemsikkerhed)
                                </p>
                            </div>

                            {/* Kundedata */}
                            <div className="bg-glass/30 border border-glass/50 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-foreground mb-3">
                                    2.2 Kundeoplysninger
                                </h3>
                                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                                    <li>Navn, email, telefonnummer</li>
                                    <li>Adresse (for bookinger)</li>
                                    <li>Servicehistorik og præferencer</li>
                                    <li>Betalingshistorik (ikke kreditkortoplysninger)</li>
                                    <li>Kommunikationshistorik (emails, noter)</li>
                                </ul>
                                <p className="text-sm text-muted-foreground mt-3">
                                    <strong>Formål:</strong> Kundeadministration, booking management, fakturering
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    <strong>Retsgrundlag:</strong> Kontraktindgåelse og kontraktopfyldelse
                                </p>
                            </div>

                            {/* Lead data */}
                            <div className="bg-glass/30 border border-glass/50 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-foreground mb-3">
                                    2.3 Lead-oplysninger
                                </h3>
                                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                                    <li>Kontaktoplysninger (navn, email, telefon)</li>
                                    <li>Forespørgselsdetaljer (servicetype, adresse)</li>
                                    <li>Kilde (Leadmail.no, hjemmeside, etc.)</li>
                                    <li>Status og konverteringshistorik</li>
                                </ul>
                                <p className="text-sm text-muted-foreground mt-3">
                                    <strong>Formål:</strong> Lead management, salgsopfølgning, konvertering til kunder
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    <strong>Retsgrundlag:</strong> Samtykke (ved henvendelse) eller berettiget interesse
                                </p>
                            </div>

                            {/* Tekniske data */}
                            <div className="bg-glass/30 border border-glass/50 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-foreground mb-3">
                                    2.4 Tekniske Data
                                </h3>
                                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                                    <li>IP-adresser (ved login)</li>
                                    <li>Browser type og enhedsinformation</li>
                                    <li>Fejllogs og performance metrics</li>
                                    <li>System usage analytics</li>
                                </ul>
                                <p className="text-sm text-muted-foreground mt-3">
                                    <strong>Formål:</strong> Sikkerhed, fejlfinding, systemoptimering
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    <strong>Retsgrundlag:</strong> Berettiget interesse (systemsikkerhed og drift)
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Hvordan bruger vi data */}
                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-foreground mb-4">
                            3. Hvordan Bruger Vi Dine Data?
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                                    <span className="text-primary font-bold text-sm">1</span>
                                </div>
                                <div>
                                    <p className="font-medium text-foreground mb-1">Kundeadministration</p>
                                    <p className="text-sm text-muted-foreground">
                                        Administrere kundeforhold, bookinger, og servicelevering
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                                    <span className="text-primary font-bold text-sm">2</span>
                                </div>
                                <div>
                                    <p className="font-medium text-foreground mb-1">AI-Drevet Email Håndtering</p>
                                    <p className="text-sm text-muted-foreground">
                                        Google Gemini AI analyserer indkommende emails og genererer svar (efter godkendelse)
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                                    <span className="text-primary font-bold text-sm">3</span>
                                </div>
                                <div>
                                    <p className="font-medium text-foreground mb-1">Booking og Kalender</p>
                                    <p className="text-sm text-muted-foreground">
                                        Synkronisere med Google Calendar for effektiv planlægning
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                                    <span className="text-primary font-bold text-sm">4</span>
                                </div>
                                <div>
                                    <p className="font-medium text-foreground mb-1">Analytics og Rapportering</p>
                                    <p className="text-sm text-muted-foreground">
                                        Analysere forretningsperformance og trends (anonymiseret når muligt)
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Deling af data */}
                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-6 h-6 text-warning" />
                            4. Deling af Data med Tredjeparter
                        </h2>
                        <p className="text-muted-foreground leading-relaxed mb-4">
                            Vi deler dine data med følgende tredjepartstjenester (alle GDPR-compliant):
                        </p>

                        <div className="space-y-3">
                            <div className="bg-glass/30 border border-glass/50 rounded-lg p-3">
                                <p className="font-medium text-foreground mb-1">Clerk (clerk.com)</p>
                                <p className="text-sm text-muted-foreground">
                                    Autentificering og brugeradministration • US-baseret med EU data residency
                                </p>
                            </div>
                            <div className="bg-glass/30 border border-glass/50 rounded-lg p-3">
                                <p className="font-medium text-foreground mb-1">Google Workspace</p>
                                <p className="text-sm text-muted-foreground">
                                    Gmail og Calendar integration • Standard Terms of Service gælder
                                </p>
                            </div>
                            <div className="bg-glass/30 border border-glass/50 rounded-lg p-3">
                                <p className="font-medium text-foreground mb-1">Render.com</p>
                                <p className="text-sm text-muted-foreground">
                                    Cloud hosting (EU region) • SOC 2 Type II certificeret
                                </p>
                            </div>
                            <div className="bg-glass/30 border border-glass/50 rounded-lg p-3">
                                <p className="font-medium text-foreground mb-1">Leadmail.no</p>
                                <p className="text-sm text-muted-foreground">
                                    Lead import tjeneste • Norsk virksomhed (EØS-område)
                                </p>
                            </div>
                        </div>

                        <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 mt-4">
                            <p className="text-sm font-medium text-foreground mb-2">
                                ⚠️ Vigtigt om dataoverførsler
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Visse tjenester (Clerk, Google) kan overføre data til USA. Dette sker i henhold til
                                EU's standardkontraktbestemmelser (SCCs) og EU-US Data Privacy Framework.
                            </p>
                        </div>
                    </section>

                    {/* Sikkerhed */}
                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                            <Lock className="w-6 h-6 text-success" />
                            5. Datasikkerhed
                        </h2>
                        <p className="text-muted-foreground leading-relaxed mb-4">
                            Vi beskytter dine data med følgende sikkerhedsforanstaltninger:
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                            <li><strong>Kryptering:</strong> TLS 1.3 for alle dataoverførsler (HTTPS)</li>
                            <li><strong>Database:</strong> PostgreSQL med krypteret forbindelse og regulære backups</li>
                            <li><strong>Autentificering:</strong> Multi-factor authentication (MFA) tilgængelig via Clerk</li>
                            <li><strong>Adgangskontrol:</strong> Role-based access control (RBAC)</li>
                            <li><strong>Logging:</strong> Komplet audit trail af dataadgang</li>
                            <li><strong>Monitoring:</strong> 24/7 overvågning for sikkerhedstrusler</li>
                        </ul>
                    </section>

                    {/* Dine rettigheder */}
                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-foreground mb-4">
                            6. Dine Rettigheder (GDPR)
                        </h2>
                        <p className="text-muted-foreground leading-relaxed mb-4">
                            I henhold til GDPR har du følgende rettigheder:
                        </p>
                        <div className="space-y-3">
                            <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
                                <p className="font-medium text-foreground mb-1">✓ Ret til indsigt</p>
                                <p className="text-sm text-muted-foreground">
                                    Du kan anmode om kopi af alle data vi har om dig
                                </p>
                            </div>
                            <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
                                <p className="font-medium text-foreground mb-1">✓ Ret til berigtigelse</p>
                                <p className="text-sm text-muted-foreground">
                                    Du kan få rettet forkerte eller ufuldstændige oplysninger
                                </p>
                            </div>
                            <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
                                <p className="font-medium text-foreground mb-1">✓ Ret til sletning</p>
                                <p className="text-sm text-muted-foreground">
                                    Du kan anmode om sletning af dine data ("Retten til at blive glemt")
                                </p>
                            </div>
                            <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
                                <p className="font-medium text-foreground mb-1">✓ Ret til dataportabilitet</p>
                                <p className="text-sm text-muted-foreground">
                                    Du kan få dine data i et struktureret, almindeligt anvendt format
                                </p>
                            </div>
                            <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
                                <p className="font-medium text-foreground mb-1">✓ Ret til at gøre indsigelse</p>
                                <p className="text-sm text-muted-foreground">
                                    Du kan gøre indsigelse mod behandling baseret på berettiget interesse
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Opbevaring */}
                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-foreground mb-4">
                            7. Hvor Længe Opbevarer Vi Data?
                        </h2>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                            <li><strong>Kundedata:</strong> Så længe kundeforholdet er aktivt + 5 år (bogføringsloven)</li>
                            <li><strong>Lead data:</strong> 2 år fra sidste kontakt (derefter automatisk sletning)</li>
                            <li><strong>Brugerdata:</strong> Så længe brugeren er aktiv + 30 dage efter deaktivering</li>
                            <li><strong>Tekniske logs:</strong> 90 dage (sikkerhedslogs opbevares 1 år)</li>
                        </ul>
                    </section>

                    {/* Cookies */}
                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-foreground mb-4">
                            8. Cookies og Tracking
                        </h2>
                        <p className="text-muted-foreground leading-relaxed mb-4">
                            RenOS bruger følgende cookies:
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                            <li><strong>Nødvendige cookies:</strong> Session cookies for autentificering (Clerk)</li>
                            <li><strong>Performance cookies:</strong> Anonymiseret analytics (kan deaktiveres)</li>
                            <li><strong>Funktionelle cookies:</strong> Bruger-præferencer (tema, sprog)</li>
                        </ul>
                        <p className="text-sm text-muted-foreground mt-4">
                            Vi bruger IKKE marketing eller tracking cookies fra tredjeparter.
                        </p>
                    </section>

                    {/* Kontakt */}
                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                            <Mail className="w-6 h-6 text-primary" />
                            9. Kontakt og Klager
                        </h2>
                        <p className="text-muted-foreground leading-relaxed mb-4">
                            Har du spørgsmål om vores databeskyttelse eller vil udøve dine rettigheder?
                        </p>
                        <div className="bg-glass/30 border border-glass/50 rounded-lg p-4 mb-4">
                            <p className="text-foreground font-medium mb-2">Dataansvarlig</p>
                            <p className="text-sm text-muted-foreground mb-1">Rendetalje</p>
                            <p className="text-sm text-muted-foreground mb-1">
                                Email: <a href="mailto:privacy@rendetalje.dk" className="text-primary hover:underline">privacy@rendetalje.dk</a>
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Responstid: Maksimalt 30 dage (GDPR-krav)
                            </p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Du har altid ret til at klage til Datatilsynet, hvis du mener, at vi behandler dine
                            personoplysninger i strid med databeskyttelsesreglerne:
                        </p>
                        <div className="bg-glass/30 border border-glass/50 rounded-lg p-4 mt-3">
                            <p className="text-foreground font-medium mb-2">Datatilsynet</p>
                            <p className="text-sm text-muted-foreground mb-1">Carl Jacobsens Vej 35</p>
                            <p className="text-sm text-muted-foreground mb-1">2500 Valby</p>
                            <p className="text-sm text-muted-foreground">
                                Email: <a href="mailto:dt@datatilsynet.dk" className="text-primary hover:underline">dt@datatilsynet.dk</a>
                            </p>
                        </div>
                    </section>

                    {/* Ændringer */}
                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-foreground mb-4">
                            10. Ændringer til Privatlivspolitikken
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Vi kan opdatere denne privatlivspolitik fra tid til anden. Væsentlige ændringer vil
                            blive kommunikeret via email. Vi anbefaler, at du regelmæssigt gennemgår denne side
                            for opdateringer.
                        </p>
                    </section>

                </div>

                {/* Footer */}
                <div className="mt-12 pt-8 border-t border-border">
                    <p className="text-sm text-muted-foreground text-center mb-4">
                        Denne privatlivspolitik er sidst opdateret 6. oktober 2025
                    </p>
                    <p className="text-sm text-muted-foreground text-center">
                        Se også vores <Link to="/vilkaar" className="text-primary hover:underline">Vilkår og Betingelser</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
