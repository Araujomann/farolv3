import { LegalDocumentScreen } from "@/src/features/legal/components/LegalDocumentScreen";
import { PRIVACY_POLICY } from "@/src/features/legal/legalContent";

export default function PrivacyScreen() {
    return <LegalDocumentScreen document={PRIVACY_POLICY} />;
}
