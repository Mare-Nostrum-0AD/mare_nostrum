# source this file before developing
# Variables:
# OAD_PARENT_DIR
# OAD_MOD_DIR
# OAD_CHILD_DIR
# OAD_GIT_BASE

# extract diff of mod files
function extract_diff() {
	(
	cd "${OAD_PARENT_DIR}"
	git diff --patch --binary "${OAD_GIT_BASE}" -- binaries/data/mods/public
	)
}

# extract names of files that differ from git_base
function extract_files() {
	(
	cd "${OAD_PARENT_DIR}"
	extract_diff | grep -e '^diff --git' | sed -re 's#^.*? b/(.*)$#\1#' | sed -e 's#binaries/data/mods/public/##'
	)
}

function sync_to_child() {
	(
	cd "${OAD_CHILD_DIR}"
	rm -rf ./*
	cd "${OAD_MOD_DIR}"
	IFS=$'\n\r'
	files=($(extract_files))
	for file in ${files[@]}; do
		outfile="${OAD_CHILD_DIR}/${file}"
		outdir="$(dirname "${outfile}")"
		[[ ! -d "${outdir}" ]] && mkdir -p "${outdir}"
		cp -f "${file}" "${outfile}"
	done
	extract_diff > "${OAD_CHILD_DIR}/dev/mod.diff"
	git log -n 1 "${OAD_GIT_BASE}" > "${OAD_CHILD_DIR}/dev/git_base.txt"
	cd "${OAD_CHILD_DIR}"
	git add ${files[@]}
	)
}


function sync_from_child() {
	(
	cd "${OAD_CHILD_DIR}"
	IFS=$'\n\r'
	for file in $(find . -type f | cut -c3- | grep -v -e '^\.git' -e '^dev/'); do
		outfile="${OAD_PARENT_DIR}/${file}"
		outdir="$(dirname "${outfile}")"
		[[ ! -d "${outdir}" ]] && mkdir -p "${outdir}"
		cp -f "${file}" "${outfile}"
	done
	)
}

function commit() {
	(
	[[ ! $1 ]] && echo 'please enter commit message' >&2
	commit_msg="$1"
	cd "${OAD_PARENT_DIR}"
	git commit -am "${commit_msg}"
	sync_to_child
	cd "${OAD_CHILD_DIR}"
	git commit -am "${commit_msg}"
	)
}
