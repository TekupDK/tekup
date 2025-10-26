import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Terms() {
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
                    <h1 className="text-4xl font-bold text-foreground mb-4">
                        Vilkår og Betingelser
                    </h1>
                    <p className="text-muted-foreground">
                        Sidst opdateret: 6. oktober 2025
                    </p>
                </div>

                {/* Content */}
                <div className="prose prose-slate dark:prose-invert max-w-none">

                    {/* 1. Introduktion */}
                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-foreground mb-4">
                            1. Introduktion
                        </h2>
                        <p className="text-muted-foreground leading-relaxed mb-4">
                            Velkommen til RenOS - Rendetalje Management System. Ved at bruge vores platform accepterer du
                            følgende vilkår og betingelser. Læs venligst disse vilkår grundigt, før du bruger systemet.
                        </p>
                        <p className="text-muted-foreground leading-relaxed">
                            RenOS er udviklet til at hjælpe Rendetalje med at administrere kunder, bookinger, leads
                            og rengøringsservices effektivt gennem AI-drevet automatisering.
                        </p>
                    </section>

                    {/* 2. Tjenestebeskrivelse */}
                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-foreground mb-4">
                            2. Tjenestebeskrivelse
                        </h2>
                        <p className="text-muted-foreground leading-relaxed mb-4">
                            RenOS tilbyder følgende funktioner:
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                            <li>Kundeadministration og Customer 360° visning</li>
                            <li>Lead tracking og konvertering</li>
                            <li>Booking og kalender management</li>
                            <li>AI-drevet email håndtering og auto-respons</li>
                            <li>Analytics og rapportering</li>
                            <li>Integration med Google Calendar og Gmail</li>
                            <li>Automatisk lead import fra Leadmail.no</li>
                        </ul>
                    </section>

                    {/* 3. Brugeransvar */}
                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-foreground mb-4">
                            3. Brugeransvar
                        </h2>
                        <p className="text-muted-foreground leading-relaxed mb-4">
                            Som bruger af RenOS accepterer du at:
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                            <li>Beskytte dine login-oplysninger og ikke dele dem med uautoriserede personer</li>
                            <li>Bruge systemet i overensstemmelse med gældende dansk lovgivning</li>
                            <li>Ikke misbruge systemet til ulovlige eller skadelige aktiviteter</li>
                            <li>Respektere kunders personlige data i henhold til GDPR</li>
                            <li>Rapportere sikkerhedsproblemer eller fejl omgående til systemadministratoren</li>
                        </ul>
                    </section>

                    {/* 4. Databeskyttelse */}
                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-foreground mb-4">
                            4. Databeskyttelse og GDPR
                        </h2>
                        <p className="text-muted-foreground leading-relaxed mb-4">
                            RenOS behandler kundedata ansvarligt:
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                            <li>Alle data krypteres under transmission (HTTPS)</li>
                            <li>Personoplysninger behandles i henhold til GDPR</li>
                            <li>Data gemmes sikkert i PostgreSQL database hos certificeret cloud-udbyder</li>
                            <li>Brugere har ret til indsigt, rettelse og sletning af deres data</li>
                            <li>Se vores <Link to="/privatlivspolitik" className="text-primary hover:underline">Privatlivspolitik</Link> for detaljer</li>
                        </ul>
                    </section>

                    {/* 5. Tredjepartstjenester */}
                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-foreground mb-4">
                            5. Integration med Tredjepartstjenester
                        </h2>
                        <p className="text-muted-foreground leading-relaxed mb-4">
                            RenOS integrerer med følgende tredjepartstjenester:
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                            <li><strong>Clerk:</strong> Autentificering og brugeradministration</li>
                            <li><strong>Google Workspace:</strong> Gmail og Google Calendar integration</li>
                            <li><strong>Leadmail.no:</strong> Automatisk lead import</li>
                            <li><strong>Google Gemini AI:</strong> AI-drevet email generering</li>
                            <li><strong>Render.com:</strong> Cloud hosting</li>
                        </ul>
                        <p className="text-muted-foreground leading-relaxed mt-4">
                            Brug af disse tjenester er underlagt deres egne vilkår og betingelser.
                        </p>
                    </section>

                    {/* 6. Ansvarsbegrænsning */}
                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-foreground mb-4">
                            6. Ansvarsbegrænsning
                        </h2>
                        <p className="text-muted-foreground leading-relaxed mb-4">
                            RenOS leveres "as is" uden garantier af nogen art. Vi er ikke ansvarlige for:
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                            <li>Datatab som følge af tekniske fejl eller bruger-handlinger</li>
                            <li>Nedetid forårsaget af tredjepartstjenester</li>
                            <li>Indirekte tab eller forretningsafbrydelser</li>
                            <li>Fejl i AI-genereret indhold (emails, anbefalinger)</li>
                        </ul>
                        <p className="text-muted-foreground leading-relaxed mt-4">
                            Vi bestræber os på 99.9% uptime, men garanterer ikke fejlfri drift.
                        </p>
                    </section>

                    {/* 7. Ændringer til Vilkår */}
                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-foreground mb-4">
                            7. Ændringer til Vilkår
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Vi forbeholder os retten til at ændre disse vilkår når som helst. Væsentlige ændringer
                            vil blive kommunikeret via email eller systemnotifikationer. Fortsat brug af RenOS efter
                            ændringer betyder accept af de opdaterede vilkår.
                        </p>
                    </section>

                    {/* 8. Opsigelse */}
                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-foreground mb-4">
                            8. Opsigelse af Adgang
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Vi forbeholder os retten til at suspendere eller opsige adgang til RenOS ved
                            overtrædelse af disse vilkår, mistanke om misbrug, eller sikkerhedshensyn.
                        </p>
                    </section>

                    {/* 9. Lovvalg */}
                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-foreground mb-4">
                            9. Lovvalg og Jurisdiktion
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Disse vilkår er underlagt dansk lovgivning. Eventuelle tvister skal løses ved
                            danske domstole.
                        </p>
                    </section>

                    {/* 10. Kontakt */}
                    <section className="mb-8">
                        <h2 className="text-2xl font-semibold text-foreground mb-4">
                            10. Kontaktinformation
                        </h2>
                        <p className="text-muted-foreground leading-relaxed mb-4">
                            Har du spørgsmål til disse vilkår, kontakt venligst:
                        </p>
                        <div className="bg-glass/30 border border-glass/50 rounded-lg p-4">
                            <p className="text-foreground font-medium mb-2">Rendetalje</p>
                            <p className="text-muted-foreground text-sm">
                                Email: <a href="mailto:info@rendetalje.dk" className="text-primary hover:underline">info@rendetalje.dk</a>
                            </p>
                            <p className="text-muted-foreground text-sm">
                                Website: <a href="https://rendetalje.dk" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">rendetalje.dk</a>
                            </p>
                        </div>
                    </section>

                </div>

                {/* Footer */}
                <div className="mt-12 pt-8 border-t border-border">
                    <p className="text-sm text-muted-foreground text-center">
                        Ved at fortsætte med at bruge RenOS accepterer du disse vilkår og vores{' '}
                        <Link to="/privatlivspolitik" className="text-primary hover:underline">
                            Privatlivspolitik
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
