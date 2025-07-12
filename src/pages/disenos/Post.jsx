import React from 'react';
import Card from '../../components/Card';
import { loadData } from '../../services/SyncService';
import ImageGeneratorAI from '../../components/ImageGeneratorAI';

// Plantillas predefinidas para posts y contenido para redes sociales
const socialMediaTemplates = [
  {
    name: 'Anuncio de Compromiso',
    description: 'Post elegante para anunciar el compromiso en redes sociales',
    prompt: 'Diseña una imagen para anunciar un compromiso en redes sociales. Formato cuadrado (1:1) ideal para Instagram. Incluye el texto "¡Nos casamos!" o similar y espacio para añadir la fecha. Estilo elegante y romántico con elementos como anillos, flores o corazones sutiles. La imagen debe ser sofisticada pero emotiva, adecuada para compartir en cualquier plataforma social.'
  },
  {
    name: 'Save the Date',
    description: 'Post para informar a invitados sobre la fecha de la boda',
    prompt: 'Crea un diseño de "Save the Date" para compartir en redes sociales. Formato cuadrado optimizado para Instagram y otras plataformas. Incluye la frase "Save the Date" de forma destacada y espacio para incluir la fecha y posiblemente el lugar. El estilo debe ser moderno y atractivo visualmente, con elementos gráficos que llamen la atención pero manteniendo la elegancia. La imagen debe transmitir la emoción y la anticipación del evento.'
  },
  {
    name: 'Cuenta Atrás',
    description: 'Post que muestra los días restantes hasta la boda',
    prompt: 'Diseña una plantilla para posts de cuenta atrás para boda en redes sociales. Formato cuadrado para Instagram. Debe incluir prominentemente el texto "Faltan X días" con un espacio claro donde se pueda editar el número. El diseño debe ser atractivo visualmente con elementos festivos pero elegantes. Incluye algún elemento gráfico como un reloj, calendario o similar que enfatice el concepto de cuenta atrás. Los colores deben ser acordes a una boda.'
  },
  {
    name: 'Hashtag de Boda',
    description: 'Post que destaca el hashtag personalizado para la boda',
    prompt: 'Crea un diseño para promocionar un hashtag personalizado de boda en redes sociales. Formato cuadrado para Instagram y otras plataformas. El diseño debe destacar prominentemente el texto "#NuestroHashtag" (como ejemplo, debe ser fácilmente reemplazable). Incorpora elementos visuales atractivos que complementen el tema de la boda. La composición debe ser clara y legible incluso en pantallas pequeñas, animando a los invitados a usar el hashtag cuando compartan fotos del evento.'
  },
  {
    name: 'Agradecimiento Post-Boda',
    description: 'Post para agradecer a invitados tras la celebración',
    prompt: 'Diseña una imagen para publicar en redes sociales como agradecimiento después de una boda. Formato cuadrado para Instagram. Incluye un texto como "Gracias por compartir nuestro día especial" u otra frase de agradecimiento similar. El diseño debe transmitir gratitud y emoción, con elementos elegantes que evoquen la celebración. Utiliza una paleta de colores romántica y sofisticada. La imagen debe ser lo suficientemente versátil para acompañar una galería de fotos del evento.'
  },
];

export default function PostDiseno() {
  // Obtener información del perfil para personalizar los prompts si es posible
  const getProfileInfo = () => {
    try {
      const profile = loadData('lovendaProfile', { defaultValue: {}, collection: 'userProfiles' });
      const names = [];
      
      if (profile.brideFirstName && profile.groomFirstName) {
        names.push(`${profile.brideFirstName} & ${profile.groomFirstName}`);
      } else if (profile.brideFirstName) {
        names.push(profile.brideFirstName);
      } else if (profile.groomFirstName) {
        names.push(profile.groomFirstName);
      }
      
      let customInfo = '';
      
      if (names.length > 0) {
        customInfo += `Incluye los nombres: ${names.join(' y ')}. `;
      }
      
      if (profile.weddingDate) {
        // Formato simple de fecha
        customInfo += `La fecha de la boda es: ${profile.weddingDate}. `;
      }
      
      if (profile.weddingLocation) {
        customInfo += `La boda se celebra en: ${profile.weddingLocation}. `;
      }
      
      return customInfo;
    } catch (err) {
      console.error('Error al obtener información del perfil:', err);
      return '';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Diseño de Posts para Redes Sociales</h1>
        <p className="text-gray-600">Crea imágenes atractivas para compartir en tus redes sociales antes, durante y después de la boda. Selecciona un estilo o personaliza tu propio diseño.</p>
        
        <div className="mt-2">
          <p className="text-sm text-blue-600">
            <span className="font-medium">Consejo:</span> Estas imágenes están optimizadas para formato cuadrado, ideal para Instagram y otras plataformas de redes sociales.
          </p>
        </div>
      </Card>
      
      <ImageGeneratorAI 
        category="social-media" 
        templates={socialMediaTemplates}
        onImageGenerated={(image) => {
          console.log('Nuevo diseño para redes sociales generado:', image);
        }}
      />
    </div>
  );
}
