import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Input, Button } from '../components/ui';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleIcon,
  ClockIcon,
  PlusCircleIcon, 
  TagIcon,
  BellIcon,
  ExclamationCircleIcon,
  PaperclipIcon,
  XIcon
} from '../components/ui/icons';

import { 
  initEmailService, 
  getMails, 
  sendMail, 
  deleteMail, 
  createEmailAlias,
  markAsRead
} from '../services/EmailService';

import { 
  loadData, 
  saveData 
} from '../services/StorageService';

import {
  createTrackingRecord,
  updateTrackingStatus,
  loadTrackingRecords,
  updateTrackingWithResponse,
  updateTrackingTags,
  deleteTrackingRecord,
  TRACKING_STATUS,
  EMAIL_TAGS
} from '../services/EmailTrackingService';

import { getTemplateOptions, applyTemplate } from '../services/emailTemplates';

export default function Buzon() {
  const [folder, setFolder] = useState('inbox');
  const [search, setSearch] = useState('');
  const [mails, setMails] = useState([]);
  const [selected, setSelected] = useState(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [form, setForm] = useState({ to: '', subject: '', body: '', attachments: [] });
  const [userEmail, setUserEmail] = useState(null);
  const [showEmailConfig, setShowEmailConfig] = useState(false);
  const [emailAlias, setEmailAlias] = useState('');
  const [aliasStatus, setAliasStatus] = useState({ loading: false, error: null, success: false });
  const [serviceStatus, setServiceStatus] = useState({ initialized: false, error: null });

  const [profile, setProfile] = useState(null);

  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const fileInputRef = useRef(null);

  const [trackingRecords, setTrackingRecords] = useState([]);
  const [trackingSelected, setTrackingSelected] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('priority');
  const [showTrackingEditModal, setShowTrackingEditModal] = useState(false);
  const [trackingForm, setTrackingForm] = useState({
    status: '',
    dueDate: '',
    notes: '',
    tags: []
  });

  const [providers, setProviders] = useState([]);

  useEffect(() => {
    async function loadProfile() {
      try {
        const userProfile = await loadData('lovendaProfile', {});
        setProfile(userProfile);
        
        const storedProviders = await loadData('providers', { defaultValue: [] });
        setProviders(storedProviders);
        
        const email = initEmailService(userProfile);
        setUserEmail(email);
        setServiceStatus({ initialized: true, error: null });
        
        if (userProfile.emailAlias) {
          setEmailAlias(userProfile.emailAlias);
        }
        
        const tracking = loadTrackingRecords();
        setTrackingRecords(tracking);
        
        console.log('Servicio de correo inicializado:', email);
      } catch (error) {
        console.error('Error al inicializar el servicio de correo:', error);
        setServiceStatus({ initialized: false, error: error.message });
      }
    }
    
    loadProfile();
    
    // Cargar las plantillas de correo
    const templateOpts = getTemplateOptions();
    setTemplates(templateOpts);
  }, []);

  useEffect(() => {
    if (!serviceStatus.initialized) return;
    
    const loadEmails = async () => {
      try {
        const emails = await getMails(folder);
        console.log('Correos cargados:', emails);
        setMails(emails);
      } catch (error) {
        console.error('Error al cargar correos:', error);
      }
    };
    
    loadEmails();
  }, [folder, serviceStatus.initialized]);

  const refresh = useCallback(async () => {
    if (!serviceStatus.initialized) return;
    
    try {
      const emails = await getMails(folder);
      setMails(emails);
    } catch (error) {
      console.error('Error al refrescar correos:', error);
    }
  }, [folder, serviceStatus.initialized]);

  const handleCreateAlias = async () => {
    if (!emailAlias) return;
    
    setAliasStatus({ loading: true, error: null, success: false });
    
    try {
      await createEmailAlias(emailAlias);
      
      setAliasStatus({ loading: false, error: null, success: true });
      
      // Actualizar perfil
      if (profile) {
        const updatedProfile = { ...profile, emailAlias };
        await saveData('lovendaProfile', updatedProfile);
        setProfile(updatedProfile);
      }
    } catch (error) {
      console.error('Error al crear alias:', error);
      setAliasStatus({ loading: false, error: error.message, success: false });
    }
  };

  const handleAttachmentUpload = (e) => {
    const files = Array.from(e.target.files);
    setForm({
      ...form,
      attachments: [...form.attachments, ...files]
    });
  };

  const removeAttachment = (index) => {
    const newAttachments = [...form.attachments];
    newAttachments.splice(index, 1);
    setForm({
      ...form,
      attachments: newAttachments
    });
  };

  const handleSendEmail = async () => {
    if (!form.to || !form.subject) {
      alert('Por favor completa los campos requeridos');
      return;
    }
    
    try {
      await sendMail({
        to: form.to,
        subject: form.subject,
        body: form.body,
        attachments: form.attachments
      });
      
      alert('Correo enviado exitosamente');
      setComposeOpen(false);
      setForm({ to: '', subject: '', body: '', attachments: [] });
      
      // Actualizar bandeja de enviados
      if (folder === 'sent') {
        refresh();
      }
    } catch (e) {
      console.error('Error al enviar correo:', e);
      alert(`Error al enviar correo: ${e.message || 'Intenta nuevamente más tarde'}`);
    }
  };
