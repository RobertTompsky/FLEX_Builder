import {
  useRef,
  useState,
} from "react";

import {
  reatomComponent,
} from "@reatom/react";

import {
  metadata,
} from "../../model/metadata";

import {
  uploadsApi,
} from "../../api/uploads";

import styles from "./styles.module.scss";

const ACCEPTED_FILES =
  ".txt,.md,.json,.csv,.xml,.js,.ts";

export const AgentFilesPanel =
  reatomComponent(() => {
    const fileInputRef =
      useRef<HTMLInputElement>(null);

    const uploads =
      metadata.data()?.uploads ?? [];

    const [
      pendingFiles,
      setPendingFiles,
    ] = useState<File[]>([]);

    const [
      selectedFiles,
      setSelectedFiles,
    ] = useState<Set<string>>(
      () => new Set(),
    );

    const [
      uploading,
      setUploading,
    ] = useState(false);

    const [
      deleting,
      setDeleting,
    ] = useState(false);

    const [
      error,
      setError,
    ] = useState<string | null>(
      null,
    );

    const toggleFile = (
      file: string,
    ) => {
      setSelectedFiles(
        (current) => {
          const next =
            new Set(current);

          if (next.has(file)) {
            next.delete(file);
          } else {
            next.add(file);
          }

          return next;
        },
      );
    };

    const clearPendingFiles =
      () => {
        setPendingFiles([]);

        if (fileInputRef.current) {
          fileInputRef.current.value =
            "";
        }
      };

    const uploadSelectedFiles =
      async () => {
        if (
          pendingFiles.length === 0
        ) {
          return;
        }

        setUploading(true);
        setError(null);

        try {
          await uploadsApi.upload(
            pendingFiles,
          );

          clearPendingFiles();

          await metadata.load();
        } catch (error) {
          setError(
            error instanceof Error
              ? error.message
              : "Upload failed",
          );
        } finally {
          setUploading(false);
        }
      };

    const deleteSelectedFiles =
      async () => {
        if (
          selectedFiles.size === 0
        ) {
          return;
        }

        setDeleting(true);
        setError(null);

        try {
          await uploadsApi.delete(
            [...selectedFiles],
          );

          setSelectedFiles(
            new Set(),
          );

          await metadata.load();
        } catch (error) {
          setError(
            error instanceof Error
              ? error.message
              : "Delete failed",
          );
        } finally {
          setDeleting(false);
        }
      };

    return (
      <section
        className={styles.panel}
      >
        <header
          className={styles.header}
        >
          <span
            className={
              styles.headerIcon
            }
            aria-hidden="true"
          >
            ■
          </span>

          <span
            className={
              styles.headerTitle
            }
          >
            UPLOADED FILES
          </span>

          <span
            className={
              styles.headerCount
            }
          >
            [
            {String(
              uploads.length,
            ).padStart(2, "0")}
            ]
          </span>
        </header>

        <div
          className={styles.body}
        >
          <input
            ref={fileInputRef}
            className={
              styles.fileInput
            }
            type="file"
            multiple
            accept={ACCEPTED_FILES}
            onChange={(event) => {
              setPendingFiles(
                Array.from(
                  event.currentTarget
                    .files ?? [],
                ),
              );
            }}
          />

          <section
            className={
              styles.uploadSection
            }
          >
            <div
              className={
                styles.uploadIntro
              }
            >
              <span
                className={
                  styles.folderIcon
                }
                aria-hidden="true"
              >
                ▰
              </span>

              <span>
                Select files to upload.
              </span>
            </div>

            <button
              className={
                styles.selectButton
              }
              type="button"
              disabled={
                uploading || deleting
              }
              onClick={() => {
                fileInputRef.current
                  ?.click();
              }}
            >
              SELECT FILES
            </button>
          </section>

          <button
            className={
              styles.dropZone
            }
            type="button"
            disabled={
              uploading || deleting
            }
            onClick={() => {
              fileInputRef.current
                ?.click();
            }}
          >
            <span
              className={
                styles.documentIcon
              }
              aria-hidden="true"
            >
              <span />
              <span />
              <span />
            </span>

            <span
              className={
                styles.dropTitle
              }
            >
              SELECT FILES
            </span>

            <span
              className={
                styles.dropHint
              }
            >
              TXT · MD · JSON · CSV
              · XML · JS · TS
            </span>
          </button>

          {pendingFiles.length > 0 && (
            <div
              className={
                styles.pending
              }
            >
              <div
                className={
                  styles.pendingInfo
                }
              >
                <span>
                  READY TO UPLOAD
                </span>

                <span>
                  [
                  {String(
                    pendingFiles.length,
                  ).padStart(
                    2,
                    "0",
                  )}
                  ]
                </span>
              </div>

              <div
                className={
                  styles.pendingActions
                }
              >
                <button
                  className={
                    styles.smallButton
                  }
                  type="button"
                  disabled={uploading}
                  onClick={
                    clearPendingFiles
                  }
                >
                  CLEAR
                </button>

                <button
                  className={
                    styles.smallButton
                  }
                  type="button"
                  disabled={uploading}
                  onClick={
                    uploadSelectedFiles
                  }
                >
                  {uploading
                    ? "UPLOADING..."
                    : "UPLOAD"}
                </button>
              </div>
            </div>
          )}

          <section
            className={
              styles.filesSection
            }
          >
            <div
              className={
                styles.sectionTitle
              }
            >
              <span
                className={
                  styles.sectionMarker
                }
                aria-hidden="true"
              >
                ■
              </span>

              <span>
                AVAILABLE FILES
              </span>

              <span
                className={
                  styles.sectionLine
                }
              />
            </div>

            <div
              className={
                styles.files
              }
            >
              {uploads.length === 0 && (
                <div
                  className={
                    styles.empty
                  }
                >
                  NO FILES UPLOADED
                </div>
              )}

              {uploads.map(
                (file, index) => {
                  const selected =
                    selectedFiles.has(
                      file,
                    );

                  const extension =
                    file
                      .split(".")
                      .at(-1)
                      ?.slice(0, 4)
                      .toUpperCase() ??
                    "FILE";

                  return (
                    <label
                      key={file}
                      className={[
                        styles.fileRow,
                        selected &&
                          styles.selected,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <input
                        className={
                          styles.fileCheckbox
                        }
                        type="checkbox"
                        checked={selected}
                        onChange={() => {
                          toggleFile(file);
                        }}
                      />

                      <span
                        className={
                          styles.fileDocument
                        }
                        aria-hidden="true"
                      >
                        <span />
                        <span />
                        <span />
                      </span>

                      <span
                        className={
                          styles.fileInfo
                        }
                      >
                        <span
                          className={
                            styles.fileName
                          }
                          title={file}
                        >
                          {file}
                        </span>

                        <span
                          className={
                            styles.fileMeta
                          }
                        >
                          {String(
                            index + 1,
                          ).padStart(
                            2,
                            "0",
                          )}
                          {" · "}
                          {extension}
                        </span>
                      </span>

                      <span
                        className={
                          styles.checkboxVisual
                        }
                        aria-hidden="true"
                      >
                        {selected
                          ? "■"
                          : "□"}
                      </span>
                    </label>
                  );
                },
              )}
            </div>
          </section>

          {error && (
            <div
              className={styles.error}
            >
              !! {error}
            </div>
          )}

          <footer
            className={
              styles.actions
            }
          >
            <button
              className={
                styles.actionButton
              }
              type="button"
              disabled={
                selectedFiles.size === 0 ||
                deleting
              }
              onClick={() => {
                setSelectedFiles(
                  new Set(),
                );
              }}
            >
              CANCEL
              {selectedFiles.size > 0 &&
                ` (${selectedFiles.size})`}
            </button>

            <button
              className={[
                styles.actionButton,
                styles.deleteButton,
              ].join(" ")}
              type="button"
              disabled={
                selectedFiles.size === 0 ||
                deleting
              }
              onClick={
                deleteSelectedFiles
              }
            >
              {deleting
                ? "DELETING..."
                : `DELETE${
                    selectedFiles.size > 0
                      ? ` (${selectedFiles.size})`
                      : ""
                  }`}
            </button>
          </footer>
        </div>
      </section>
    );
  });