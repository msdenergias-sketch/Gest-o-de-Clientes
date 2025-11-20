
import React, { useState, useEffect } from 'react';
import { Cliente, Anexo } from '../types';

interface ClientDetailsProps {
  cliente: Cliente;
  onClose: () => void;
}

export const ClientDetails: React.FC<ClientDetailsProps> = ({ cliente, onClose }) => {
  const [previewData, setPreviewData] = useState<{data: string, type: 'image'} | null>(null);
  // Estado para armazenar URL de blob para PDFs
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    const formatDate = (date?: string) => date ? new Date(date).toLocaleDateString('pt-BR') : 'Pendente';
    
    const text = `
*SOLARTEKPRO - FICHA DO CLIENTE*
--------------------------------
*DADOS PESSOAIS*
Nome: ${cliente.nome}
CPF/CNPJ: ${cliente.cpf}
Telefone: ${cliente.telefone}
Email: ${cliente.email || 'Não informado'}
Endereço: ${cliente.logradouro}, ${cliente.numero} ${cliente.complemento ? `- ${cliente.complemento}` : ''}
Bairro: ${cliente.bairro} | Cidade: ${cliente.cidade} - ${cliente.cep}
Ponto de Referência: ${cliente.ponto_referencia || '-'}

*DADOS TÉCNICOS*
UC: ${cliente.unidade_consumidora}
Concessionária: ${cliente.concessionaria}
Disjuntor: ${cliente.disjuntor_padrao}
Sistema: ${cliente.tipo_sistema}

*STATUS DO PROJETO*
Status Atual: ${cliente.status}
Tempo de Projeto: ${cliente.tempo_projeto || 0} horas
Entrada Homologação: ${formatDate(cliente.data_entrada_homologacao)}
Resposta Concessionária: ${formatDate(cliente.data_resposta_concessionaria)}
Vistoria: ${formatDate(cliente.data_vistoria)}

*DOCUMENTAÇÃO*
RG/CNH: ${cliente.doc_identificacao_status}
Conta Energia: ${cliente.conta_energia_status}
Procuração: ${cliente.procuracao_status}
    `.trim();
    
    navigator.clipboard.writeText(text);
    alert("✅ Dados copiados para a área de transferência!");
  };

  const downloadAnexo = (anexo: Anexo) => {
    const link = document.createElement('a');
    link.href = anexo.dados;
    link.download = anexo.nome;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreview = (anexo: Anexo) => {
    if (anexo.tipo === 'application/pdf') {
      try {
        const base64 = anexo.dados.includes(',') ? anexo.dados.split(',')[1] : anexo.dados;
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
      } catch (e) {
        console.error("Erro ao abrir PDF", e);
        alert("Erro ao abrir PDF. Tente baixar o arquivo.");
      }
    } else if (anexo.tipo.startsWith('image/')) {
      setPreviewData({ data: anexo.dados, type: 'image' });
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const renderAttachmentList = (title: string, status: string, anexos: Anexo[]) => (
    <div className="border border-slate-700 rounded-xl p-4 bg-slate-800/50 print-border-gray break-inside-avoid hover:border-blue-500/30 transition-colors">
      <div className="flex justify-between items-center mb-3">
        <span className="font-bold text-slate-300 text-xs uppercase tracking-wider print-text-black">{title}</span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
          status === 'Aprovado' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 
          status === 'Recebido' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
          'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
        } print-text-black print-bg-white print-border-gray`}>
          {status}
        </span>
      </div>
      
      {anexos && anexos.length > 0 ? (
        <div className="space-y-2">
          {anexos.map((anexo) => {
            const isImage = anexo.tipo.startsWith('image/');
            const isPdf = anexo.tipo === 'application/pdf';
            const canPreview = isImage || isPdf;

            return (
              <div key={anexo.id} className="flex items-center gap-3 bg-slate-900/50 p-2 rounded-lg border border-slate-700 print-bg-white print-border-gray hover:bg-slate-700/50 transition-colors">
                {/* Preview / Icon */}
                <div 
                  className={`w-10 h-10 flex-shrink-0 bg-slate-800 rounded overflow-hidden flex items-center justify-center border border-slate-600 ${canPreview ? 'cursor-pointer hover:border-blue-400' : ''}`}
                  onClick={() => canPreview && handlePreview(anexo)}
                >
                  {isImage ? (
                    <img src={anexo.dados} alt="Preview" className="w-full h-full object-cover" />
                  ) : isPdf ? (
                    <span className="text-lg text-red-400">📄</span>
                  ) : (
                    <span className="text-lg text-slate-400">📎</span>
                  )}
                </div>
                
                {/* Info */}
                <div className="flex-grow min-w-0">
                  <p className="text-xs font-medium text-slate-200 truncate print-text-black" title={anexo.nome}>{anexo.nome}</p>
                  <p className="text-[10px] text-slate-500">{(anexo.tamanho / 1024).toFixed(1)} KB</p>
                </div>

                {/* Action Buttons - Hidden on Print */}
                <div className="flex gap-1 no-print">
                  {canPreview && (
                    <button 
                      onClick={() => handlePreview(anexo)}
                      className="px-2 py-1 text-xs bg-slate-700 text-slate-300 rounded hover:bg-white hover:text-black transition-colors flex items-center justify-center"
                      title={isPdf ? "Abrir PDF em nova aba" : "Visualizar Imagem"}
                    >
                      👁️
                    </button>
                  )}
                  <button 
                    onClick={() => downloadAnexo(anexo)}
                    className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors flex items-center justify-center"
                    title="Baixar Arquivo"
                  >
                    ⬇
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-slate-600 italic text-center py-2">Nenhum arquivo anexado.</p>
      )}
    </div>
  );

  return (
    <>
      <div id="client-details-overlay" className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-0 md:p-4">
        
        {/* Modal Content */}
        <div 
          id="client-details-content" 
          className="bg-slate-900 border border-white/10 md:rounded-2xl shadow-2xl w-full max-w-4xl h-full md:h-auto md:max-h-[90vh] overflow-y-auto"
        >
            
            {/* Header with Actions (Hidden on Print) */}
            <div className="sticky top-0 bg-slate-900/95 backdrop-blur border-b border-white/10 px-4 md:px-6 py-4 flex justify-between items-center z-10 no-print">
              <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                  👤 Detalhes do Cliente
              </h2>
              <div className="flex space-x-2">
                  <button onClick={handleCopy} className="hidden md:flex px-3 py-1.5 bg-blue-500/10 text-blue-300 border border-blue-500/30 rounded-lg hover:bg-blue-500/20 transition-colors text-xs font-bold uppercase tracking-wide items-center gap-2">
                    📋 Copiar
                  </button>
                  <button onClick={handlePrint} className="px-3 py-1.5 bg-slate-800 text-slate-300 border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors text-xs font-bold uppercase tracking-wide flex items-center gap-2">
                    🖨️ <span className="hidden md:inline">Imprimir / PDF</span>
                  </button>
                  <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors">
                    ✕
                  </button>
              </div>
            </div>
            
            {/* Printable Content */}
            <div className="p-4 md:p-8 space-y-6 md:space-y-8 print-content">
              {/* Header for Print Only */}
              <div className="hidden print-header text-center mb-8 border-b-2 border-gray-800 pb-4 pt-4">
                  <div className="flex items-center justify-center gap-4 mb-2">
                      <img 
                        src="https://drive.google.com/thumbnail?id=1hlyKB3L9oHLtRSrCV-JNdQXpZELdML-p&sz=w200" 
                        alt="Logo" 
                        className="h-16 object-contain"
                        referrerPolicy="no-referrer"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                  </div>
                  <h1 className="text-3xl font-black text-gray-800 uppercase tracking-wider">SolarTekPro</h1>
                  <p className="text-sm text-gray-600 uppercase tracking-[0.3em]">Energias Renováveis</p>
                  <h2 className="text-xl mt-6 font-bold border px-4 py-1 inline-block rounded bg-gray-100">Ficha Cadastral do Cliente</h2>
              </div>

              {/* Section 1: Personal */}
              <section className="break-inside-avoid">
                  <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-700 pb-1 print:text-black print:border-gray-400">
                    Dados Pessoais
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8 text-sm">
                    <div><span className="text-xs text-slate-500 block uppercase print-text-gray">Nome Completo</span><span className="font-bold text-white text-base print-text-black">{cliente.nome}</span></div>
                    <div><span className="text-xs text-slate-500 block uppercase print-text-gray">CPF/CNPJ</span><span className="font-medium text-slate-300 font-mono print-text-black">{cliente.cpf}</span></div>
                    <div><span className="text-xs text-slate-500 block uppercase print-text-gray">Telefone</span><span className="font-medium text-slate-300 print-text-black">{cliente.telefone}</span></div>
                    <div><span className="text-xs text-slate-500 block uppercase print-text-gray">Email</span><span className="font-medium text-slate-300 print-text-black">{cliente.email || '-'}</span></div>
                    <div className="md:col-span-2 bg-slate-800/50 p-4 rounded-xl border border-slate-700 print-bg-white">
                        <span className="text-xs text-slate-500 block uppercase mb-1 print-text-gray">Endereço Completo</span>
                        <span className="font-bold text-white block print-text-black">
                          {cliente.logradouro}, {cliente.numero} {cliente.complemento ? `- ${cliente.complemento}` : ''}
                        </span>
                        <span className="text-slate-400 block text-sm mt-1 print-text-black">
                          {cliente.bairro} - {cliente.cidade} / CEP: {cliente.cep}
                        </span>
                        {cliente.ponto_referencia && (
                          <span className="block mt-2 text-xs text-slate-500 italic border-t border-slate-700 pt-2 print-text-gray">
                              Ref: {cliente.ponto_referencia}
                          </span>
                        )}
                    </div>
                  </div>
              </section>

              {/* Section 2: Technical */}
              <section className="break-inside-avoid mt-8">
                  <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-700 pb-1 print:text-black print:border-gray-400">
                    Dados da Instalação
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-blue-900/20 rounded-xl border border-blue-500/20 print-bg-white print-border-gray">
                    <div><span className="text-[10px] text-blue-300/70 block uppercase print-text-gray">UC</span><span className="font-bold text-blue-100 font-mono text-lg print-text-black">{cliente.unidade_consumidora}</span></div>
                    <div><span className="text-[10px] text-blue-300/70 block uppercase print-text-gray">Concessionária</span><span className="font-bold text-blue-200 print-text-black">{cliente.concessionaria}</span></div>
                    <div><span className="text-[10px] text-blue-300/70 block uppercase print-text-gray">Disjuntor</span><span className="font-bold text-blue-200 print-text-black">{cliente.disjuntor_padrao}</span></div>
                    <div><span className="text-[10px] text-blue-300/70 block uppercase print-text-gray">Sistema</span><span className="font-bold text-blue-200 print-text-black">{cliente.tipo_sistema}</span></div>
                  </div>
              </section>

              {/* Section 3: Project Status */}
              <section className="break-inside-avoid mt-8">
                  <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-700 pb-1 print:text-black print:border-gray-400">
                    Status do Projeto
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <span className="text-xs text-slate-500 block uppercase print-text-gray">Status Atual</span>
                        <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold mt-1 border print-border-gray print-text-black ${
                          cliente.status === 'Concluído' ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        }`}>
                          {cliente.status}
                        </span>
                    </div>
                    <div>
                        <span className="text-xs text-slate-500 block uppercase print-text-gray">Tempo Gasto</span>
                        <span className="font-medium text-white print-text-black">{cliente.tempo_projeto} horas</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 print-bg-white">
                        <span className="text-[10px] text-slate-500 block uppercase print-text-gray">Entrada Homologação</span>
                        <span className="font-bold text-slate-200 print-text-black">{formatDate(cliente.data_entrada_homologacao)}</span>
                    </div>
                    <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 print-bg-white">
                        <span className="text-[10px] text-slate-500 block uppercase print-text-gray">Resposta Concessionária</span>
                        <span className="font-bold text-slate-200 print-text-black">{formatDate(cliente.data_resposta_concessionaria)}</span>
                    </div>
                    <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 print-bg-white">
                        <span className="text-[10px] text-slate-500 block uppercase print-text-gray">Data Vistoria</span>
                        <span className="font-bold text-slate-200 print-text-black">{formatDate(cliente.data_vistoria)}</span>
                    </div>
                  </div>
              </section>

              {/* Section 4: Docs & Attachments */}
              <section className="mt-8 break-inside-avoid">
                  <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-700 pb-1 print:text-black print:border-gray-400">
                    Documentos & Anexos
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {renderAttachmentList('RG/CNH', cliente.doc_identificacao_status, cliente.anexos_identificacao)}
                      {renderAttachmentList('Conta Energia', cliente.conta_energia_status, cliente.anexos_conta)}
                      {renderAttachmentList('Procuração', cliente.procuracao_status, cliente.anexos_procuracao)}
                      {renderAttachmentList('Outros', cliente.outras_imagens_status, cliente.anexos_outras_imagens)}
                  </div>
              </section>

              {/* Footer Print */}
              <div className="hidden print-footer mt-8 pt-8 border-t text-center text-xs text-gray-400">
                  <p>Relatório gerado pelo Sistema de Gestão SolarTekPro em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
              </div>
            </div>
        </div>

        {/* Styles for Printing */}
        <style>{`
          @media print {
            @page { 
              size: A4; 
              margin: 0.5cm; 
            }
            
            html, body {
              height: auto !important;
              overflow: visible !important;
              margin: 0 !important;
              padding: 0 !important;
              background-color: white !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            body > * {
              display: none !important;
            }

            * {
              animation: none !important;
              transition: none !important;
              box-shadow: none !important;
              text-shadow: none !important;
            }

            #client-details-overlay {
              display: block !important;
              visibility: visible !important;
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              height: auto !important;
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
              z-index: 9999 !important;
              backdrop-filter: none !important;
            }
            
            #client-details-overlay * {
              visibility: visible !important;
            }

            #client-details-content {
              display: block !important;
              position: static !important;
              width: 100% !important;
              max-width: 100% !important;
              height: auto !important;
              max-height: none !important;
              overflow: visible !important;
              box-shadow: none !important;
              border: none !important;
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
              color: black !important;
            }
            
            .print-content {
                padding: 0 !important;
            }

            .no-print { display: none !important; }
            .print-header, .print-footer { display: block !important; }
            
            .print-bg-white { background-color: white !important; border: 1px solid #ccc !important; }
            .print-text-black { color: black !important; }
            .print-text-gray { color: #555 !important; }
            .print-border-gray { border-color: #ccc !important; }
          }
        `}</style>
      </div>

      {/* Image Zoom Modal */}
      {previewData && previewData.type === 'image' && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md"
          onClick={() => setPreviewData(null)}
        >
          <div className="relative max-w-[95vw] max-h-[95vh]">
            <button 
              className="absolute -top-8 -right-4 text-white hover:text-red-400 text-3xl font-bold transition-colors z-50"
              onClick={() => setPreviewData(null)}
            >
              &times;
            </button>
            <img 
              src={previewData.data} 
              alt="Visualização em tela cheia" 
              className="max-w-full max-h-full object-contain rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.8)]"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
};
