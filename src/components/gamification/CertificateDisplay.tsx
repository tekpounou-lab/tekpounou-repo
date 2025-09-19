import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { 
  AcademicCapIcon,
  DocumentIcon,
  DownloadIcon,
  ShareIcon,
  EyeIcon,
  PrinterIcon,
  CheckCircleIcon,
  GlobeAltIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Certificate {
  id: string;
  student_id: string;
  course_id: string;
  certificate_number: string;
  title: string;
  description?: string;
  issue_date: string;
  verification_code: string;
  is_public: boolean;
  courses: {
    title: string;
    teacher: {
      full_name: string;
    };
  };
  users: {
    full_name: string;
  };
}

interface CertificateDisplayProps {
  studentId?: string;
  showOnlyPublic?: boolean;
}

export function CertificateDisplay({ studentId, showOnlyPublic = false }: CertificateDisplayProps) {
  const { t } = useTranslation();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCertificates();
  }, [studentId, showOnlyPublic]);

  const fetchCertificates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = studentId || user?.id;
      if (!userId) return;

      let query = supabase
        .from('certificates')
        .select(`
          *,
          courses:course_id (
            title,
            users:teacher_id (full_name)
          ),
          users:student_id (full_name)
        `);

      if (showOnlyPublic) {
        query = query.eq('is_public', true);
      } else {
        query = query.eq('student_id', userId);
      }

      const { data, error } = await query.order('issue_date', { ascending: false });

      if (error) throw error;

      setCertificates(data || []);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      toast.error(t('error.fetchCertificates'));
    } finally {
      setLoading(false);
    }
  };

  const togglePublicVisibility = async (certificateId: string, isPublic: boolean) => {
    try {
      const { error } = await supabase
        .from('certificates')
        .update({ is_public: !isPublic })
        .eq('id', certificateId);

      if (error) throw error;

      setCertificates(prev => 
        prev.map(cert => 
          cert.id === certificateId 
            ? { ...cert, is_public: !isPublic }
            : cert
        )
      );

      toast.success(isPublic ? t('certificate.madePrivate') : t('certificate.madePublic'));
    } catch (error) {
      console.error('Error updating certificate visibility:', error);
      toast.error(t('error.updateCertificate'));
    }
  };

  const generatePDF = async (certificate: Certificate) => {
    if (!certificateRef.current) return;

    setGenerating(true);
    try {
      // Create canvas from certificate element
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Create PDF
      const imgWidth = 297; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const pdf = new jsPDF('landscape');
      const imgData = canvas.toDataURL('image/png');
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      // Save the PDF
      pdf.save(`${certificate.certificate_number}.pdf`);
      
      toast.success(t('certificate.downloaded'));
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error(t('error.generatePDF'));
    } finally {
      setGenerating(false);
    }
  };

  const shareCertificate = async (certificate: Certificate) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: certificate.title,
          text: `${certificate.users.full_name} ${t('certificate.earnedCertificate')}`,
          url: `${window.location.origin}/certificates/verify/${certificate.verification_code}`
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback - copy link to clipboard
      const url = `${window.location.origin}/certificates/verify/${certificate.verification_code}`;
      await navigator.clipboard.writeText(url);
      toast.success(t('certificate.linkCopied'));
    }
  };

  const CertificateTemplate = ({ certificate }: { certificate: Certificate }) => (
    <div 
      ref={certificateRef}
      className="w-full h-[600px] bg-gradient-to-br from-white via-accent-50 to-accent-100 border-8 border-accent-500 relative overflow-hidden"
      style={{ aspectRatio: '4/3' }}
    >
      {/* Decorative Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 left-4 w-32 h-32 rounded-full bg-accent-300"></div>
        <div className="absolute bottom-4 right-4 w-24 h-24 rounded-full bg-accent-400"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-accent-200"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full p-8 text-center">
        {/* Logo */}
        <div className="mb-6">
          <img 
            src="/logo.png" 
            alt="Tek Pou Nou" 
            className="h-16 w-auto"
          />
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-neutral-800 mb-4">
          {t('certificate.certificateOfCompletion')}
        </h1>

        {/* Subtitle */}
        <p className="text-lg text-neutral-600 mb-6">
          {t('certificate.presentedTo')}
        </p>

        {/* Student Name */}
        <h2 className="text-3xl font-bold text-accent-700 mb-6">
          {certificate.users.full_name}
        </h2>

        {/* Course Info */}
        <p className="text-lg text-neutral-700 mb-2">
          {t('certificate.forSuccessfullyCompleting')}
        </p>
        <h3 className="text-2xl font-semibold text-neutral-800 mb-6">
          {certificate.courses.title}
        </h3>

        {/* Teacher */}
        <p className="text-base text-neutral-600 mb-8">
          {t('certificate.instructedBy')} {certificate.courses.teacher.full_name}
        </p>

        {/* Footer Info */}
        <div className="flex justify-between items-end w-full mt-auto">
          <div className="text-left">
            <p className="text-sm text-neutral-600">
              {t('certificate.dateIssued')}
            </p>
            <p className="font-semibold text-neutral-800">
              {format(new Date(certificate.issue_date), 'MMMM dd, yyyy')}
            </p>
          </div>
          
          <div className="text-center">
            <AcademicCapIcon className="h-12 w-12 text-accent-600 mx-auto mb-2" />
            <p className="text-xs text-neutral-500">
              Tek Pou Nou
            </p>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-neutral-600">
              {t('certificate.certificateNumber')}
            </p>
            <p className="font-mono text-xs text-neutral-800">
              {certificate.certificate_number}
            </p>
          </div>
        </div>

        {/* Verification Code */}
        <div className="absolute bottom-2 left-2 text-xs text-neutral-400 font-mono">
          {t('certificate.verifyAt')}: tek-pou-nou.com/verify/{certificate.verification_code}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
            {showOnlyPublic ? t('certificate.publicCertificates') : t('certificate.myCertificates')}
          </h2>
          <p className="text-neutral-600 dark:text-neutral-300 mt-1">
            {showOnlyPublic 
              ? t('certificate.publicDescription') 
              : t('certificate.myDescription')
            }
          </p>
        </div>
      </div>

      {/* Certificates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {certificates.map((certificate) => (
            <motion.div
              key={certificate.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              whileHover={{ y: -5 }}
              className="group"
            >
              <Card className="p-6 h-full flex flex-col bg-gradient-to-br from-white to-accent-50 dark:from-neutral-800 dark:to-accent-900/20 border-2 border-transparent hover:border-accent-200 dark:hover:border-accent-700 transition-all duration-300">
                {/* Certificate Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <AcademicCapIcon className="h-8 w-8 text-accent-600" />
                    <div>
                      <Badge variant="success" size="sm">
                        {t('certificate.verified')}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {!showOnlyPublic && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePublicVisibility(certificate.id, certificate.is_public)}
                        className="text-neutral-500 hover:text-accent-600"
                      >
                        {certificate.is_public ? (
                          <GlobeAltIcon className="h-4 w-4" />
                        ) : (
                          <LockClosedIcon className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedCertificate(certificate);
                        setShowPreview(true);
                      }}
                      className="text-neutral-500 hover:text-accent-600"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Course Title */}
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2 line-clamp-2">
                  {certificate.courses.title}
                </h3>

                {/* Student Name (for public view) */}
                {showOnlyPublic && (
                  <p className="text-neutral-600 dark:text-neutral-300 mb-2">
                    {certificate.users.full_name}
                  </p>
                )}

                {/* Issue Date */}
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                  {t('certificate.issued')} {format(new Date(certificate.issue_date), 'MMM dd, yyyy')}
                </p>

                {/* Certificate Number */}
                <p className="text-xs font-mono text-neutral-400 dark:text-neutral-500 mb-4">
                  #{certificate.certificate_number}
                </p>

                {/* Actions */}
                <div className="mt-auto space-y-2">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCertificate(certificate);
                        generatePDF(certificate);
                      }}
                      disabled={generating}
                      className="flex-1"
                    >
                      <DownloadIcon className="h-4 w-4 mr-1" />
                      {generating ? t('certificate.generating') : t('certificate.download')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => shareCertificate(certificate)}
                      className="flex-1"
                    >
                      <ShareIcon className="h-4 w-4 mr-1" />
                      {t('certificate.share')}
                    </Button>
                  </div>
                  {!showOnlyPublic && (
                    <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                      {certificate.is_public ? (
                        <>
                          <GlobeAltIcon className="h-3 w-3" />
                          <span>{t('certificate.publiclyVisible')}</span>
                        </>
                      ) : (
                        <>
                          <LockClosedIcon className="h-3 w-3" />
                          <span>{t('certificate.private')}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {certificates.length === 0 && (
        <div className="text-center py-12">
          <AcademicCapIcon className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
            {showOnlyPublic ? t('certificate.noPublicCertificates') : t('certificate.noCertificates')}
          </h3>
          <p className="text-neutral-600 dark:text-neutral-300">
            {showOnlyPublic 
              ? t('certificate.noPublicDescription') 
              : t('certificate.noDescription')
            }
          </p>
        </div>
      )}

      {/* Certificate Preview Modal */}
      <Modal
        isOpen={showPreview && selectedCertificate !== null}
        onClose={() => {
          setShowPreview(false);
          setSelectedCertificate(null);
        }}
        title={t('certificate.preview')}
        size="xl"
      >
        {selectedCertificate && (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-lg shadow-lg">
              <CertificateTemplate certificate={selectedCertificate} />
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPreview(false);
                  setSelectedCertificate(null);
                }}
              >
                {t('common.close')}
              </Button>
              <Button
                onClick={() => generatePDF(selectedCertificate)}
                disabled={generating}
                className="flex items-center gap-2"
              >
                <DownloadIcon className="h-4 w-4" />
                {generating ? t('certificate.generating') : t('certificate.downloadPDF')}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Hidden certificate for PDF generation */}
      {selectedCertificate && !showPreview && (
        <div className="fixed -top-[1000px] left-0 z-[-1]">
          <CertificateTemplate certificate={selectedCertificate} />
        </div>
      )}
    </div>
  );
}