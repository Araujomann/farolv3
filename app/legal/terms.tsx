import { LegalDocumentScreen } from "@/src/features/legal/components/LegalDocumentScreen";
import { TERMS_OF_USE } from "@/src/features/legal/legalContent";

export default function TermsScreen() {
    return <LegalDocumentScreen document={TERMS_OF_USE} />;
}
