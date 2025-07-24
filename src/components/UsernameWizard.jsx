import { useEffect, useState } from "react";
import { auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import useEmailUsername from "../hooks/useEmailUsername";
import Spinner from "./ui/Spinner";
import Button from "./ui/Button";
import Alert from "./ui/Alert";

/**
 * Muestra un modal la primera vez que el usuario accede para que elija su nombre
 * de correo @mywed360.com. Una vez configurado desaparece para siempre.
 */
const UsernameWizard = () => {
  const {
    checkUsernameAvailability,
    reserveUsername,
    getCurrentUsername,
    loading,
    error,
  } = useEmailUsername();

  const [stepLoading, setStepLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [username, setUsername] = useState("");
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState(null); // null sin comprobar, true/false resultado
  const [feedback, setFeedback] = useState(null);

  // Al montar, esperamos a que Firebase conozca al usuario autenticado
  // y entonces comprobamos si ya tiene nombre de correo configurado.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // No hay usuario autenticado; no mostramos wizard y detenemos loading.
        setStepLoading(false);
        return;
      }

      const current = await getCurrentUsername();
      if (!current) {
        setShowWizard(true);
      }
      setStepLoading(false);
      // Nos desuscribimos porque solo necesitamos esta comprobación una vez.
      // (La función retornada por useEffect hará el cleanup).
      
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (stepLoading) return null; // evita parpadeo
  if (!showWizard) return null; // usuario ya configuró nombre

  const handleCheck = async () => {
    setChecking(true);
    const ok = await checkUsernameAvailability(username.trim());
    setAvailable(ok);
    if (ok) {
      setFeedback("Disponible ✅");
    } else {
      setFeedback("No disponible ❌");
    }
    setChecking(false);
  };

  const handleSave = async () => {
    if (!available) return;
    setChecking(true);
    const saved = await reserveUsername(username.trim());
    if (saved) {
      setShowWizard(false);
    }
    setChecking(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-semibold text-gray-700">
          Configura tu correo @mywed360.com
        </h2>
        <p className="mb-4 text-sm text-gray-600">
          Elige tu nombre de usuario. Solo podrás configurarlo una vez.
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 rounded border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            placeholder="nombre.deseado"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value.toLowerCase());
              setAvailable(null);
              setFeedback(null);
            }}
          />
          <span className="self-center text-sm text-gray-700">@mywed360.com</span>
        </div>

        {feedback && (
          <p
            className={`mt-2 text-sm ${available ? "text-green-600" : "text-red-600"}`}
          >
            {feedback}
          </p>
        )}
        {error && (
          <Alert variant="error" className="mt-2 text-sm">
            {error}
          </Alert>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={handleCheck} disabled={checking || !username}>
            {checking ? <Spinner size="sm" /> : "Comprobar"}
          </Button>
          <Button
            onClick={handleSave}
            variant="primary"
            disabled={checking || !available}
          >
            {checking ? <Spinner size="sm" /> : "Guardar"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UsernameWizard;
